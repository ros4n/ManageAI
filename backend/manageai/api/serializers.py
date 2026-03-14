from rest_framework import serializers
from .models import Memory, Flashcard


class MemorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Memory
        fields = ['id', 'user_id', 'question', 'answer', 'topic', 'summary', 'created_at']
        read_only_fields = ['id', 'created_at']


class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ['id', 'user_id', 'memory_id', 'front', 'back', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    user_id = serializers.CharField()
    conversation_history = serializers.ListField(
        child=serializers.DictField(), required=False, default=[]
    )


class SearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField()
    user_id = serializers.CharField()


class SummarizeRequestSerializer(serializers.Serializer):
    memory_id = serializers.UUIDField()
    user_id = serializers.CharField()
