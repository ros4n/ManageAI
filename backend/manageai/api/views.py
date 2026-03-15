from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Count
from pgvector.django import CosineDistance

from .models import Memory, Flashcard, ChatSession, ChatMessage
from .serializers import (
    MemorySerializer, FlashcardSerializer, ChatSessionSerializer,
    ChatMessageSerializer, ChatRequestSerializer,
    SearchRequestSerializer, SummarizeRequestSerializer,
)
from .utils import (
    detect_topic, generate_embedding,
    get_groq_response, generate_summary, generate_flashcard,
)


class ChatView(APIView):
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data         = serializer.validated_data
        user_message = data['message']
        history      = data['conversation_history']
        image_base64 = data.get('image_base64')

        topic         = detect_topic(user_message)
        past_memories = Memory.objects.filter(topic=topic).order_by('-created_at')[:3]

        context = ''
        if past_memories:
            context = '\n\nRelevant past knowledge:\n'
            for m in past_memories:
                context += f'Q: {m.question}\nA: {m.answer[:300]}\n\n'

        system_prompt = (
            'You are ManageAI, a friendly AI assistant with memory. '
            'Be clear, helpful, and concise. Use markdown when appropriate.'
            + context
        )

        messages = history[-10:] + [{'role': 'user', 'content': user_message}]
        answer   = get_groq_response(messages, system_prompt)

        embedding = generate_embedding(user_message + ' ' + answer)
        summary   = generate_summary(user_message, answer)

        memory = Memory.objects.create(
            question=user_message, answer=answer,
            topic=topic, summary=summary, embedding=embedding,
        )

        return Response({
            'answer': answer, 'memory_id': str(memory.id),
            'topic': topic, 'context_used': len(past_memories) > 0,
        })


class MemoryListView(APIView):
    def get(self, request):
        topic    = request.query_params.get('topic')
        memories = Memory.objects.all()
        if topic:
            memories = memories.filter(topic=topic)
        return Response(MemorySerializer(memories, many=True).data)

    def delete(self, request):
        memory_id = request.query_params.get('id')
        if not memory_id:
            return Response({'error': 'id required'}, status=400)
        Memory.objects.filter(id=memory_id).delete()
        return Response({'success': True})


class SearchView(APIView):
    def post(self, request):
        serializer = SearchRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        query           = serializer.validated_data['query']
        query_embedding = generate_embedding(query)

        if query_embedding:
            memories = Memory.objects.filter(
                embedding__isnull=False
            ).order_by(CosineDistance('embedding', query_embedding))[:10]
        else:
            memories = Memory.objects.filter(
                Q(question__icontains=query) | Q(answer__icontains=query)
            )[:10]

        return Response(MemorySerializer(memories, many=True).data)


class SummarizeView(APIView):
    def post(self, request):
        serializer = SummarizeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        try:
            memory    = Memory.objects.get(id=serializer.validated_data['memory_id'])
        except Memory.DoesNotExist:
            return Response({'error': 'Memory not found'}, status=404)

        fc_data   = generate_flashcard(memory.question, memory.answer)
        flashcard = Flashcard.objects.create(memory=memory, front=fc_data['front'], back=fc_data['back'])
        return Response(FlashcardSerializer(flashcard).data)


class FlashcardListView(APIView):
    def get(self, request):
        return Response(FlashcardSerializer(Flashcard.objects.all(), many=True).data)


class BulkFlashcardsView(APIView):
    def post(self, request):
        Flashcard.objects.all().delete()
        memories = Memory.objects.all()[:12]
        created  = []
        for memory in memories:
            fc_data = generate_flashcard(memory.question, memory.answer)
            created.append(Flashcard.objects.create(
                memory=memory, front=fc_data['front'], back=fc_data['back'],
            ))
        return Response(FlashcardSerializer(created, many=True).data)


class TopicsView(APIView):
    def get(self, request):
        topics = Memory.objects.values('topic').annotate(count=Count('id')).order_by('-count')
        return Response(list(topics))


class ChatSessionListView(APIView):
    def get(self, request):
        return Response(ChatSessionSerializer(ChatSession.objects.all(), many=True).data)

    def post(self, request):
        session = ChatSession.objects.create(title=request.data.get('title', 'New Chat'))
        return Response(ChatSessionSerializer(session).data, status=201)


class ChatSessionDetailView(APIView):
    def _get(self, session_id):
        try:
            return ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            return None

    def get(self, request, session_id):
        s = self._get(session_id)
        return Response(ChatSessionSerializer(s).data) if s else Response({'error': 'Not found'}, status=404)

    def patch(self, request, session_id):
        s = self._get(session_id)
        if not s:
            return Response({'error': 'Not found'}, status=404)
        if 'title' in request.data: s.title = request.data['title']
        if 'topic' in request.data: s.topic = request.data['topic']
        s.save()
        return Response(ChatSessionSerializer(s).data)

    def delete(self, request, session_id):
        s = self._get(session_id)
        if not s:
            return Response({'error': 'Not found'}, status=404)
        s.delete()
        return Response({'success': True})


class ChatSessionMessagesView(APIView):
    def get(self, request, session_id):
        msgs = ChatMessage.objects.filter(session_id=session_id)
        return Response(ChatMessageSerializer(msgs, many=True).data)