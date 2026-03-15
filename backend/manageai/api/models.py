from django.db import models
from pgvector.django import VectorField
import uuid


class Memory(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question   = models.TextField()
    answer     = models.TextField()
    topic      = models.CharField(max_length=100, default='General')
    summary    = models.TextField(blank=True, null=True)
    embedding  = VectorField(dimensions=3072, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'memories'
        ordering = ['-created_at']


class Flashcard(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    memory     = models.ForeignKey(Memory, on_delete=models.CASCADE, related_name='flashcards')
    front      = models.TextField()
    back       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'flashcards'
        ordering = ['-created_at']


class ChatSession(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title      = models.TextField(default='New Chat')
    topic      = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_sessions'
        ordering = ['-updated_at']


class ChatMessage(models.Model):
    ROLE_CHOICES = [('user', 'User'), ('assistant', 'Assistant')]
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session    = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content    = models.TextField()
    image_url  = models.TextField(blank=True, null=True)
    topic      = models.CharField(max_length=100, blank=True, null=True)
    memory     = models.ForeignKey(Memory, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']