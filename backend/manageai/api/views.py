from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from pgvector.django import CosineDistance

from .models import Memory, Flashcard
from .serializers import (
    MemorySerializer, FlashcardSerializer,
    ChatRequestSerializer, SearchRequestSerializer,
    SummarizeRequestSerializer
)
from .utils import (
    detect_topic, generate_embedding,
    get_groq_response, generate_summary, generate_flashcard
)


class ChatView(APIView):
    """
    Main chat endpoint.
    Receives a message, retrieves relevant past memories (RAG),
    calls Groq, saves the memory, returns the answer.
    """

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user_message = data['message']
        user_id = data['user_id']
        history = data['conversation_history']

        # Step 1: Detect topic
        topic = detect_topic(user_message)

        # Step 2: Retrieve relevant past memories (RAG)
        past_memories = Memory.objects.filter(
            user_id=user_id,
            topic=topic
        ).order_by('-created_at')[:3]

        # Step 3: Build system prompt with context
        context = ""
        if past_memories:
            context = "\n\nRelevant past knowledge from this user:\n"
            for m in past_memories:
                context += f"Q: {m.question}\nA: {m.answer[:300]}\n\n"

        system_prompt = (
            "You are ThinkVault, a friendly AI tutor with memory. "
            "Be clear, educational, and concise. Use code blocks when relevant."
            + context
        )

        # Step 4: Build message history
        messages = history[-10:] + [{'role': 'user', 'content': user_message}]

        # Step 5: Get AI response
        answer = get_groq_response(messages, system_prompt)

        # Step 6: Generate embedding and summary in background
        embedding = generate_embedding(user_message + " " + answer)
        summary = generate_summary(user_message, answer)

        # Step 7: Save to database
        memory = Memory.objects.create(
            user_id=user_id,
            question=user_message,
            answer=answer,
            topic=topic,
            summary=summary,
            embedding=embedding
        )

        return Response({
            'answer': answer,
            'memory_id': str(memory.id),
            'topic': topic,
            'context_used': len(past_memories) > 0
        })


class MemoryListView(APIView):
    """
    Get all memories for a user, optionally filtered by topic.
    """

    def get(self, request):
        user_id = request.query_params.get('user_id')
        topic = request.query_params.get('topic')

        if not user_id:
            return Response({'error': 'user_id required'}, status=400)

        memories = Memory.objects.filter(user_id=user_id)
        if topic:
            memories = memories.filter(topic=topic)

        serializer = MemorySerializer(memories, many=True)
        return Response(serializer.data)

    def delete(self, request):
        memory_id = request.query_params.get('id')
        user_id = request.query_params.get('user_id')

        if not memory_id or not user_id:
            return Response({'error': 'id and user_id required'}, status=400)

        Memory.objects.filter(id=memory_id, user_id=user_id).delete()
        return Response({'success': True})


class SearchView(APIView):
    """
    Semantic search using pgvector cosine similarity.
    """

    def post(self, request):
        serializer = SearchRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        query = serializer.validated_data['query']
        user_id = serializer.validated_data['user_id']

        # Generate embedding for the search query
        query_embedding = generate_embedding(query)

        if query_embedding:
            # Vector similarity search
            memories = Memory.objects.filter(
                user_id=user_id,
                embedding__isnull=False
            ).order_by(
                CosineDistance('embedding', query_embedding)
            )[:10]
        else:
            # Fallback: keyword search
            memories = Memory.objects.filter(
                user_id=user_id
            ).filter(
                Q(question__icontains=query) | Q(answer__icontains=query)
            )[:10]

        serializer = MemorySerializer(memories, many=True)
        return Response(serializer.data)


class SummarizeView(APIView):
    """
    Generate a flashcard from a saved memory.
    """

    def post(self, request):
        serializer = SummarizeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        memory_id = serializer.validated_data['memory_id']
        user_id = serializer.validated_data['user_id']

        try:
            memory = Memory.objects.get(id=memory_id, user_id=user_id)
        except Memory.DoesNotExist:
            return Response({'error': 'Memory not found'}, status=404)

        # Generate flashcard
        fc_data = generate_flashcard(memory.question, memory.answer)

        flashcard = Flashcard.objects.create(
            user_id=user_id,
            memory=memory,
            front=fc_data['front'],
            back=fc_data['back']
        )

        return Response(FlashcardSerializer(flashcard).data)


class FlashcardListView(APIView):
    """
    Get all flashcards for a user.
    """

    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=400)

        flashcards = Flashcard.objects.filter(user_id=user_id)
        serializer = FlashcardSerializer(flashcards, many=True)
        return Response(serializer.data)


class BulkFlashcardsView(APIView):
    """
    Auto-generate flashcards from all recent memories.
    Used by the dashboard 'Auto-generate' button.
    """

    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=400)

        # Delete old flashcards
        Flashcard.objects.filter(user_id=user_id).delete()

        # Get latest 12 memories
        memories = Memory.objects.filter(user_id=user_id)[:12]

        created = []
        for memory in memories:
            fc_data = generate_flashcard(memory.question, memory.answer)
            fc = Flashcard.objects.create(
                user_id=user_id,
                memory=memory,
                front=fc_data['front'],
                back=fc_data['back']
            )
            created.append(fc)

        return Response(FlashcardSerializer(created, many=True).data)


class TopicsView(APIView):
    """
    Get all topics and counts for a user.
    """

    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=400)

        from django.db.models import Count
        topics = Memory.objects.filter(
            user_id=user_id
        ).values('topic').annotate(count=Count('id')).order_by('-count')

        return Response(list(topics))
