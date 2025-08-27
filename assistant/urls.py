# assistant/urls.py

from django.urls import path
from .import views

urlpatterns = [
  # The main AI chat endpoint. This is the most important URL.
  path('chat/', views.chat_with_assistant, name='chat-with-assistant'),

# Direct data endpoints(useful for simple frontend features)
  path('recommendations/', views.get_recommendations, name='get-recommendations'),
  path('knowledge/', views.KnowledgeBaseListView.as_view(), name='knowledge-list'),
]