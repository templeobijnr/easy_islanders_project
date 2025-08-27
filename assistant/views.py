# assistant/views.py

from django.db import models
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view

# Import the AI Assistant class and our models/serializers
from .ai_assistant import EasyIslanderAI
from .models import ServiceProvider, KnowledgeBase
from .serializers import ServiceProviderSerializer, KnowledgeBaseSerializer
import logging

logger = logging.getLogger(__name__)

# --- AI CHAT ENDPOINT ---

@api_view(['POST'])
def chat_with_assistant(request):
    """
    This is the main endpoint that receives user messages and returns an AI-generated response.
    It orchestrates the entire AI conversation flow.
    """
    message = request.data.get('message', '').strip()

    if not message:
        return Response(
            {'error': 'Message cannot be empty.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # 1. Instantiate the AI brain
        ai_assistant = EasyIslanderAI()

        # 2. Process the user's message
        # This single line triggers the entire "Manager & Specialists" workflow
        assistant_response = ai_assistant.process_message(message)

        # 3. Prepare the JSON response for the frontend
        response_data = {
            'response': assistant_response.message,
            'language': assistant_response.language,
            'recommendations': assistant_response.recommendations or [],
            'function_calls': assistant_response.function_calls or [],
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        # Log the full error for debugging
        logger.error(f"Critical error in chat_with_assistant view: {e}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred on the server.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# --- DIRECT DATA ENDPOINTS (For simple, non-AI queries) ---

@api_view(['GET'])
def get_recommendations(request):
    """
    A simple API endpoint to get a list of service providers without AI.
    Example Usage: /api/recommendations/?category=car_rental&location=Kyrenia
    """
    category = request.query_params.get('category')
    location = request.query_params.get('location')
    language = request.query_params.get('language', 'en')

    queryset = ServiceProvider.objects.filter(is_active=True).order_by('-is_featured', '-rating')

    if category:
        queryset = queryset.filter(category__iexact=category)

    if location:
        queryset = queryset.filter(location__icontains=location)

    serializer_context = {'language': language}
    serializer = ServiceProviderSerializer(queryset, many=True, context=serializer_context)
    
    return Response(serializer.data)


class KnowledgeBaseListView(generics.ListAPIView):
    """
    API endpoint that allows knowledge base articles to be viewed without AI.
    Example Usage: /api/knowledge/?search=banking&language=ru
    """
    serializer_class = KnowledgeBaseSerializer

    def get_queryset(self):
        queryset = KnowledgeBase.objects.filter(is_active=True)
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) |
                models.Q(keywords__icontains=search_query) |
                models.Q(content_en__icontains=search_query)
            )
        return queryset

    def get_serializer_context(self):
        return {'language': self.request.query_params.get('language', 'en')}