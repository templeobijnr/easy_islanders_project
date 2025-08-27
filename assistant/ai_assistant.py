# assistant/ai_assistant.py

"""
AI Assistant Core Logic for the Easy Islanders Platform.
(Your excellent docstring goes here)
"""

import openai
import json
import logging
from typing import Dict, List
from dataclasses import dataclass
from langdetect import detect, LangDetectException

from django.conf import settings
from .tools import find_used_car, perform_google_search, search_services, get_knowledge, find_rental_property 

# Configure the OpenAI client
# IMPROVEMENT: Use the modern OpenAI client initialization
try:
    client = openai.Client(api_key=settings.OPENAI_API_KEY)
except Exception as e:
    logging.error(f"Failed to initialize OpenAI client: {e}")
    client = None

# Set up a logger for this module
logger = logging.getLogger(__name__)


@dataclass
class AssistantResponse:
    """A standard format for all responses from the AI assistant."""
    message: str
    language: str
    recommendations: List[Dict] = None
    function_calls: List[str] = None


class EasyIslanderAI:
    """
    The main AI Assistant class. It orchestrates the conversation flow,
    integrates with OpenAI, and uses local tools to provide answers.
    """
    def __init__(self):
        self.tool_map = {
            'search_services': search_services,
            'get_knowledge': get_knowledge,
            'find_rental_property': find_rental_property,
            'find_used_car': find_used_car,
            "perform_google_search": perform_google_search,
        }
        self.supported_languages = ['en', 'ru', 'pl', 'de', 'tr']

    def get_function_definitions(self) -> List[Dict]:
        """
        Creates the list of function definitions in the format OpenAI requires.
        This tells the AI what tools it has and how to use them.
        """
        return [
            # TOOL 1: For finding trusted, vetted providers in our internal database
            {
                "name": "search_services",
                "description": "Finds TRUSTED, VETTED service providers from our internal database. Use for lawyers, doctors, specific shops, or when the user asks for a 'recommendation'.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "category": {"type": "string", "description": "The type of service to search for (e.g., 'accommodation', 'car_rental', 'legal_services')."},
                        "location": {"type": "string", "description": "The city or area to search in (e.g., 'Kyrenia')."},
                        "language": {"type": "string", "description": "The language code of the user's request (e.g., 'en', 'ru')."}
                    },
                    "required": ["category"]
                }
            },
            # TOOL 2: For retrieving factual information from our knowledge base
            {
                "name": "get_knowledge",
                "description": "Retrieves information and guidance from the Knowledge Base on topics like residency, banking, driving rules, etc.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "topic": {"type": "string", "description": "The keyword or topic to search for (e.g., 'residency permits', 'driving rules')."},
                        "language": {"type": "string", "description": "The language code of the user's request."}
                    },
                    "required": ["topic"]
                }
            },
            # TOOL 3: The powerful web-scraping tool for rentals
            {
                "name": "find_rental_property",
                "description": "Actively scrapes real-world websites to find rental properties (apartments, villas, houses) for a user. Use this for specific, open-ended rental searches.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string", "description": "The city or area to search for rentals, e.g., 'Kyrenia', 'Esentepe'."},
                        "property_type": {"type": "string", "enum": ["apartment", "villa", "house"], "description": "The type of property."},
                        "beds": {"type": "integer", "description": "The desired number of bedrooms."},
                        "max_rent": {"type": "integer", "description": "The user's maximum monthly budget."},
                    },
                    "required": ["location", "property_type"]
                }
            },
            # TOOL 4: The powerful web-scraping tool for used cars
            {
                "name": "find_used_car",
                "description": "Actively scrapes websites to find used cars for sale in North Cyprus. Use for requests like 'find a VW Golf' or 'show me used cars'.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "make": {"type": "string", "description": "The make of the car, e.g., 'Toyota', 'Mercedes'."},
                        "model": {"type": "string", "description": "The model of the car, e.g., 'Corolla', 'C-Class'."},
                        "budget": {"type": "integer", "description": "The user's maximum budget."},
                    },
                    "required": []
                }
            },
            # TOOL 5: The general-purpose web research tool
            {
                "name": "perform_google_search",
                "description": "Use as a last resort if other tools find no results or for very niche queries. Performs a Google search to find new websites or information about a specific topic in North Cyprus.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The search query, e.g., 'araba kibris', 'best tailor in Nicosia'."}
                    },
                    "required": ["query"]
                }
            }
        ]
        
    def detect_language(self, text: str) -> str:
        """
        IMPROVEMENT: Uses the langdetect library for more reliable language detection, as suggested.
        """
        try:
            lang = detect(text)
            # Ensure the detected language is one we support, otherwise default to English
            return lang if lang in self.supported_languages else 'en'
        except LangDetectException:
            # If detection fails, default to English
            return 'en'

    def get_system_prompt(self, language: str) -> str:
        """
        IMPROVEMENT: Provides a system prompt in the user's detected language.
        """
        prompts = {
            'en': """You are Easy Islanders, a proactive friendly and extremely helpful AI assistant for North Cyprus. Your goal is to make life easy for residents and tourists. You are a knowledgeable middleman.
                - First, understand the user's intent. Are they asking for information (knowledge) or a service (search)?
                - Use the `get_knowledge` function for "how to", "what are", "tell me about" questions.
                - Use the `search_services` function for "find a", "recommend a", "I need a" requests.
                - Analyze the user's message to extract correct parameters for the function call.
                - After a function returns data, present it to the user in a clear, friendly, and helpful way.
                - NEVER make up information. Only use the data provided by the functions.
                - Always respond in the user's language.""",
            'ru': """Вы - Easy Islanders, дружелюбный и чрезвычайно полезный ИИ-помощник по Северному Кипру. Ваша цель - облегчить жизнь резидентам и туристам. Вы - знающий посредник.
                - Сначала поймите намерение пользователя. Он запрашивает информацию (знания) или услугу (поиск)?
                - Используйте функцию `get_knowledge` для вопросов "как...", "какие правила...".
                - Используйте функцию `search_services` для запросов "найди...", "порекомендуй...".
                - Проанализируйте сообщение, чтобы извлечь правильные параметры для вызова функции.
                - После получения данных от функции, представьте их пользователю в ясной и дружелюбной форме.
                - НИКОГДА не выдумывайте информацию. Используйте только данные, предоставленные функциями.
                - Всегда отвечайте на языке пользователя.""",
            # We can add Polish, German, and Turkish prompts here later
        }
        return prompts.get(language, prompts['en'])

    def process_message(self, message: str, conversation_history: List[Dict] = None) -> AssistantResponse:
        """
        This is the main method that processes a user's message.
        NOTE: conversation_history is added for future stateful conversations.
        """
        if not client:
            return AssistantResponse(message='Error: AI service is not configured.', language='en')

        language = self.detect_language(message)
        system_prompt = self.get_system_prompt(language)
        
        # For now, we are stateless, but this is where history would be added
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ]

        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                functions=self.get_function_definitions(),
                function_call='auto'
            )
            response_message = response.choices[0].message

            if response_message.function_call:
                function_name = response_message.function_call.name
                
                # IMPROVEMENT: Added error handling for JSON parsing
                try:
                    function_args = json.loads(response_message.function_call.arguments)
                except json.JSONDecodeError:
                    raise ValueError("AI generated invalid JSON for function arguments.")

                function_args["language"] = language

                tool_to_call = self.tool_map.get(function_name)
                if not tool_to_call:
                    raise ValueError(f"AI tried to call an unknown function: {function_name}")
                
                function_response = tool_to_call(**function_args)

                final_response = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages + [
                        response_message,
                        {
                            "role": "function",
                            "name": function_name,
                            "content": json.dumps(function_response),
                        },
                    ],
                )
                final_message = final_response.choices[0].message.content

                return AssistantResponse(
                    message=final_message,
                    language=language,
                    recommendations=function_response.get("data", []),
                    function_calls=[function_name]
                )
            else:
                return AssistantResponse(
                    message=response_message.content,
                    language=language
                )
        except Exception as e:
            logger.error(f"An error occurred in the AI assistant: {e}")
            return AssistantResponse(
                message="I'm sorry, I'm having trouble connecting to my services right now. Please try again in a moment.",
                language=language
            )