"""
Tavily API Client Wrappers

Thin HTTP wrappers for Tavily's search, extract, and other endpoints.
Handles Bearer authentication and error handling.
"""

import os
import requests
from typing import Dict, Any, Optional

BASE_URL = "https://api.tavily.com"

def _get_headers() -> Dict[str, str]:
    """Get headers with Bearer authentication."""
    api_key = os.getenv("TAVILY_API_KEY", "")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

def search(query: str, **kwargs) -> Dict[str, Any]:
    """
    Search for information using Tavily.
    
    Args:
        query: Search query string
        **kwargs: Additional parameters (search_depth, time_range, etc.)
    
    Returns:
        JSON response from Tavily search endpoint
    """
    payload = {"query": query, **kwargs}
    response = requests.post(
        f"{BASE_URL}/search",
        json=payload,
        headers=_get_headers(),
        timeout=12
    )
    response.raise_for_status()
    return response.json()

def extract(url: str, **kwargs) -> Dict[str, Any]:
    """
    Extract structured content from a URL.
    
    Args:
        url: URL to extract from
        **kwargs: Additional parameters
    
    Returns:
        JSON response with extracted content
    """
    payload = {"url": url, **kwargs}
    response = requests.post(
        f"{BASE_URL}/extract",
        json=payload,
        headers=_get_headers(),
        timeout=20
    )
    response.raise_for_status()
    return response.json()

def crawl(domain: str, **kwargs) -> Dict[str, Any]:
    """
    Crawl a domain for content.
    
    Args:
        domain: Domain to crawl
        **kwargs: Additional parameters
    
    Returns:
        JSON response with crawl results
    """
    payload = {"domain": domain, **kwargs}
    response = requests.post(
        f"{BASE_URL}/crawl",
        json=payload,
        headers=_get_headers(),
        timeout=60
    )
    response.raise_for_status()
    return response.json()

def site_map(domain: str, **kwargs) -> Dict[str, Any]:
    """
    Get site map for a domain.
    
    Args:
        domain: Domain to get sitemap for
        **kwargs: Additional parameters
    
    Returns:
        JSON response with site map
    """
    payload = {"domain": domain, **kwargs}
    response = requests.post(
        f"{BASE_URL}/map",
        json=payload,
        headers=_get_headers(),
        timeout=30
    )
    response.raise_for_status()
    return response.json()
