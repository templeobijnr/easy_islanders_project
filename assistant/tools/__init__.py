# assistant/tools/__init__.py

import logging

from bs4 import BeautifulSoup
from assistant.models import ServiceProvider, KnowledgeBase
from assistant.scrapers.car_finder import sync_find_all_cars
from assistant.serializers import ServiceProviderSerializer, KnowledgeBaseSerializer
from django.db.models import Q

# CORRECTED IMPORT: We import the one master function we need
from assistant.scrapers.property_finder import get_random_headers, sync_find_all_properties

logger = logging.getLogger(__name__)


def search_services(category: str, location: str = None, language: str = 'en', **kwargs) -> dict:
    """
    TOOL #1: Finds TRUSTED, VETTED service providers from our internal database.
    """
    logger.info(f"Executing tool: search_services (Category: {category}, Location: {location})")
    try:
        queryset = ServiceProvider.objects.filter(is_active=True, category__iexact=category)
        if location:
            queryset = queryset.filter(location__icontains=location)
        queryset = queryset.order_by('-is_featured', '-rating')[:5]
        serializer_context = {'language': language}
        serializer = ServiceProviderSerializer(queryset, many=True, context=serializer_context)
        return {"success": True, "count": len(serializer.data), "data": serializer.data}
    except Exception as e:
        logger.error(f"Error in search_services tool: {e}")
        return {"success": False, "error": str(e)}


def get_knowledge(topic: str, language: str = 'en', **kwargs) -> dict:
    """
    TOOL #2: Retrieves curated information from the Knowledge Base.
    """
    logger.info(f"Executing tool: get_knowledge (Topic: {topic})")
    try:
        queryset = KnowledgeBase.objects.filter(is_active=True).filter(
            Q(title__icontains=topic) | Q(keywords__icontains=topic) | Q(content_en__icontains=topic)
        )[:3]
        if not queryset.exists():
            return {"success": False, "error": "No information found on that topic."}
        serializer_context = {'language': language}
        serializer = KnowledgeBaseSerializer(queryset, many=True, context=serializer_context)
        return {"success": True, "count": len(serializer.data), "data": serializer.data}
    except Exception as e:
        logger.error(f"Error in get_knowledge tool: {e}")
        return {"success": False, "error": str(e)}


def find_rental_property(location: str, property_type: str, beds: int = None, max_rent: int = None, language: str = 'en') -> dict:
    """
    TOOL #3: The "Action Agent" tool. Deploys the full suite of scrapers to find rental properties.
    """
    logger.info(f"Executing tool: find_rental_property (Location: {location}, Type: {property_type})")
    
    # CORRECTED LOGIC: This tool's only job is to call the master finder function.
    scraped_properties = sync_find_all_properties(location=location, property_type='rent')
    
    if not scraped_properties:
        return {"success": False, "error": f"I've scoured all my usual channels, but I couldn't find any {property_type}s for rent in {location} right now."}

    return {
        "success": True,
        "count": len(scraped_properties),
        "data": scraped_properties
    }


def find_used_car(make:str = None, model: str = None, budget: int = None, language: str = 'en') -> dict:
  """
  TOOL #4: Actively finds used cars for sale by scraping known local websites.
  """
  logger.info(f"Executing tool: find_used_car (Make: {make})")

  scraped_cars = sync_find_all_cars(make=make, model=model)

  if not scraped_cars:
    return {"success":False, "error":"I couldn't find any matching cars on the main websites I checked".}

    # In the future, we could filer by budget here

    return {
      "success":True,
      "count": len(scraped_cars),
      "data": scraped_cars
    }


def perform_google_search(query: str, language:str = 'en') -> dict: 
  """
  TOOL #5: Performs a Google search to discover new websites and information when the primary tools cannot find a result. It returns a list of links and summaries.
  """
  logger.info(f"Executing tool: perform_google_search (Query: {query})")
  try:
    # We add "North Cyprus" to the query to ensure geographic relevance
    search_query = f"{query} in North Cyprus"
    url = "https://www.google.com/search"
    params = {"q": search_query, "hl": language}
    headers = get_random_headers()

    response = requests.get(url, params=params, headers=headers, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # This is a standard selector for Google search results
    results = []
    for g in soup.find_all('div', class_="g"):
      link_tag = g.find('a')
      title_tag = g.find("h3")
      snippet_tag = g.find('div', style="display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;")

      if link_tag and title_tag and snippet_tag and link_tag['href'].startswith('http'):
        results.append({
          "title": title_tag.text,
          "link": link_tag['href'],
          "snippet": snippet_tag.text
        })

    if not results:
            return {"success": False, "error": "I couldn't find any relevant web pages for that search."}

    return {"success": True, "count": len(results), "data": results[:5]} # Return top 5 results
  except Exception as e:
    logger.error(f"Error in perform_google_search: {e}")
    return {"success": False, "error": str(e)}