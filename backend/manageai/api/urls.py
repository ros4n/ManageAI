from django.urls import path
from . import views

urlpatterns = [
    path('chat/',                                views.ChatView.as_view()),
    path('models/',                              views.ModelsView.as_view()),  # ← new
    path('memories/',                            views.MemoryListView.as_view()),
    path('search/',                              views.SearchView.as_view()),
    path('summarize/',                           views.SummarizeView.as_view()),
    path('flashcards/',                          views.FlashcardListView.as_view()),
    path('flashcards/bulk/',                     views.BulkFlashcardsView.as_view()),
    path('topics/',                              views.TopicsView.as_view()),
    path('sessions/',                            views.ChatSessionListView.as_view()),
    path('sessions/<uuid:session_id>/',          views.ChatSessionDetailView.as_view()),
    path('sessions/<uuid:session_id>/messages/', views.ChatSessionMessagesView.as_view()),
    path('format-memory/',                       views.FormatMemoryView.as_view()),
]