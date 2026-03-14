from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.ChatView.as_view(), name='chat'),
    path('memories/', views.MemoryListView.as_view(), name='memories'),
    path('search/', views.SearchView.as_view(), name='search'),
    path('summarize/', views.SummarizeView.as_view(), name='summarize'),
    path('flashcards/', views.FlashcardListView.as_view(), name='flashcards'),
    path('flashcards/bulk/', views.BulkFlashcardsView.as_view(), name='bulk-flashcards'),
    path('topics/', views.TopicsView.as_view(), name='topics'),
]
