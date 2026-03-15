from rest_framework import serializers
from .models import Memory, Flashcard, ChatSession, ChatMessage


class MemorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Memory
        fields = ['id', 'question', 'answer', 'topic', 'summary', 'created_at']
        read_only_fields = ['id', 'created_at']


class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Flashcard
        fields = ['id', 'memory_id', 'front', 'back', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ChatSession
        fields = ['id', 'title', 'topic', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ChatMessage
        fields = ['id', 'session_id', 'role', 'content', 'image_url', 'topic', 'memory_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatRequestSerializer(serializers.Serializer):
    message              = serializers.CharField()
    conversation_history = serializers.ListField(child=serializers.DictField(), required=False, default=[])
    image_base64         = serializers.CharField(required=False, allow_null=True)


class SearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField()


class SummarizeRequestSerializer(serializers.Serializer):
    memory_id = serializers.UUIDField()