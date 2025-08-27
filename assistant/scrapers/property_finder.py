# assistant/scrapers/property_finder.py

"""
Property Finder Agent for the Easy Islanders Platform.

This module embodies the AI's core capability as a real estate "action agent."
Its purpose is to replicate and automate the exhaustive, multi-channel search
process that a human would undertake to find a rental or for-sale property in the
fragmented North Cyprus market. Focus is exclusively on Northern Cyprus (TRNC).

Core Purpose:
-------------
To serve as the AI's primary tool for **supply aggregation**. It is designed to
scour a diverse and constantly changing set of online sources—from structured
real estate portals to unstructured social media groups—to build a comprehensive,
near real-time database of available properties in Northern Cyprus only.

This module is the engine behind the platform's real estate marketplace and is
a key enabler of the "Commission Island" monetization strategy.

Legal/Ethical Note: Scraping social media violates ToS and risks bans. Use ethically,
respect privacy, and consider alternatives like APIs or partnerships. Proxies and
rotation are used to minimize detection.
"""

import asyncio
import logging
import re
import time
from typing import List, Dict, Optional
from urllib.parse import urljoin
from functools import wraps
import random

import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from telethon import TelegramClient
from telethon.tl.functions.messages import GetHistoryRequest

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

# --- Configuration ---
# Pulled from your detailed research document.
# ---

# Proxies & Headers
PROXIES_POOL = getattr(settings, 'SCRAPER_PROXIES', [])
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
]

def get_random_headers():
    return {'User-Agent': random.choice(USER_AGENTS)}

def get_random_proxy():
    return random.choice(PROXIES_POOL) if PROXIES_POOL else None

# Cache Configuration
CACHE_TTL = 3600  # 1 hour

# Real Estate Website Configurations (from your document)
WEBSITE_SCRAPERS_CONFIG = {
    'landmark_estates': {'base_url':'https://www.north-cyprus-properties-landmark.com','endpoints':{'rent':'/properties-rent/','sale':'/properties-sale/'},'listing_selector':'div.property-listing, div.listing-item','title_selector':'h2.property-title, div.listing-title','price_selector':'div.property-price, span.listing-price','location_selector':'div.property-location, div.listing-location','image_selector':'img.property-image, div.listing-photo img','url_selector':'a.property-link, div.property-listing a'},
    'ncea_estate_agents': {'base_url':'https://www.ncestateagents.com','endpoints':{'rent':'/property-rentals/','sale':'/properties-for-sale/'},'listing_selector':'div.property-item, div.listing-container','title_selector':'h3.property-name, div.property-title','price_selector':'div.property-price, span.price-display','location_selector':'div.property-location, span.location-text','image_selector':'img.property-photo, div.property-image img','url_selector':'a.property-details, div.property-item a'},
    'busy_bees_estate': {'base_url':'https://busybeesestateagents-cyprus.net','endpoints':{'rent':'/search/rentals/','sale':'/search/properties/'},'listing_selector':'div.property-item, div.listing-box','title_selector':'h4.property-title, div.prop-title','price_selector':'div.property-cost, span.price-display','location_selector':'div.property-location, div.area-name','image_selector':'img.property-photo, div.property-image img','url_selector':'a.property-url, div.property-item a'},
    'henry_charles_estates': {'base_url':'https://www.henrycharlesestates.com','endpoints':{'rent':'/Property?CategoryId=1&ForRentOrSale=2','sale':'/Property?CategoryId=1&ForRentOrSale=1'},'listing_selector':'div.property-card, div.property-item','title_selector':'h3.property-title, div.property-name','price_selector':'div.property-price, span.price','location_selector':'div.property-location, span.location','image_selector':'img.property-image, div.property-photo img','url_selector':'a.property-link, div.property-card a'},
    'azant_real_estates': {'base_url':'https://www.azantrealestates.com','endpoints':{'rent':'/rental-properties/','sale':'/properties-for-sale/'},'listing_selector':'div.property-listing, div.listing-container','title_selector':'h2.property-title, div.listing-name','price_selector':'div.property-price, span.listing-price','location_selector':'div.property-address, div.listing-location','image_selector':'img.property-image, div.listing-photo img','url_selector':'a.property-link, div.property-listing a'},
    'unwin_estates': {'base_url':'https://unwinestates.com','endpoints':{'rent':'/properties-for-rent-in-kyrenia.php','sale':'/properties-for-sale-in-kyrenia.php'},'listing_selector':'div.property-item, div.listing-container','title_selector':'h3.property-name, div.property-title','price_selector':'div.property-price, span.price-display','location_selector':'div.property-area, div.location-info','image_selector':'img.property-img, div.property-photo img','url_selector':'a.property-details, div.property-item a'},
    'carrington_cyprus': {'base_url':'https://carringtoncyprus.com','endpoints':{'rent':'/properties/rent/','sale':'/properties/sale/'},'listing_selector':'div.property-box, div.listing-container','title_selector':'h3.property-name, div.listing-title','price_selector':'div.property-price, span.price-display','location_selector':'div.property-area, div.location-info','image_selector':'img.property-img, div.property-photo img','url_selector':'a.property-details, div.property-box a'},
    'goldmark_estates': {'base_url':'https://goldmarkestates.com','endpoints':{'rent':'/kiralık/','sale':'/satılık/'},'listing_selector':'div.property-item','title_selector':'h3.property-title','price_selector':'div.property-price','location_selector':'div.property-location','image_selector':'img.property-image','url_selector':'a.property-link'},
    'envoy_emlak': {'base_url':'https://www.envoyemlak.com','endpoints':{'rent':'/kiralık/','sale':'/satılık/'},'listing_selector':'div.emlak-item, div.property-container','title_selector':'h3.emlak-baslik, div.property-title','price_selector':'div.emlak-fiyat, span.price-amount','location_selector':'div.emlak-konum, div.property-location','image_selector':'img.emlak-resim, div.property-image img','url_selector':'a.emlak-link, div.emlak-item a'},
    '101evler_portal': {'base_url':'https://www.101evler.com/en','endpoints':{'rent':'/properties/rent/','sale':'/properties/sale/'},'listing_selector':'div.property-item, div.listing-card','title_selector':'h3.property-title, div.listing-name','price_selector':'div.property-price, span.price-amount','location_selector':'div.property-location, div.listing-address','image_selector':'img.property-image, div.listing-photo img','url_selector':'a.property-link, div.property-item a'},
    'hangiev_portal': {'base_url':'https://www.hangiev.com','endpoints':{'rent':'/emlak/kiralik/','sale':'/emlak/satilik/'},'listing_selector':'div.emlak-ilan, div.property-listing','title_selector':'h3.ilan-baslik, div.property-title','price_selector':'div.ilan-fiyat, span.property-price','location_selector':'div.ilan-konum, div.property-location','image_selector':'img.ilan-foto, div.property-image img','url_selector':'a.ilan-detay, div.emlak-ilan a'},
}

# Social Media Targets
FACEBOOK_GROUPS = ["546977953442031", "261370650999277", "294968971813910", "1713524379160845"]
INSTAGRAM_ACCOUNTS = ["kellerwilliamsisland", "cypruslife.estate.en", "surkonestate_en"]
TELEGRAM_CHANNELS = ["selectestatesinternational", "cyrealestate", "hayatestate_online"]

# Credentials from settings
SOCIAL_COOKIES = getattr(settings, 'SOCIAL_COOKIES', None)
TELEGRAM_API_ID = getattr(settings, 'TELEGRAM_API_ID', None)
# ... etc for other credentials

# --- Helper Functions ---
def cache_decorator(ttl=CACHE_TTL):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create a cache key based on function name and arguments
            key_args = '_'.join(map(str, args))
            key_kwargs = '_'.join(f'{k}_{v}' for k, v in sorted(kwargs.items()))
            cache_key = f"scraper:{func.__name__}:{key_args}:{key_kwargs}"
            
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.info(f"Cache HIT for {func.__name__} with key: {cache_key}")
                return cached_result
            
            logger.info(f"Cache MISS for {func.__name__}. Executing function.")
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator

def normalize_price(price_str: str) -> Optional[float]:
    if not isinstance(price_str, str): return None
    try:
        # This regex is more robust: handles commas, currency symbols, and text
        cleaned = re.search(r'[\d\.,]+', price_str.replace(',', ''))
        return float(cleaned.group(0)) if cleaned else None
    except (ValueError, TypeError):
        return None

def deduplicate_properties(properties: List[Dict]) -> List[Dict]:
    seen = set()
    unique_properties = []
    for prop in properties:
        # A more robust key using title and normalized price
        key = (prop.get('title', '').strip().lower(), prop.get('normalized_price'))
        if key not in seen and prop.get('title'):
            seen.add(key)
            unique_properties.append(prop)
    return unique_properties

def filter_properties_by_keywords(properties: List[Dict], location: str, property_type: str) -> List[Dict]:
    # ... (implementation from your document)
    return properties

# --- Generic Website Scraper ---
@cache_decorator()
async def scrape_generic_website(site_key: str, location: str, property_type: str, max_pages: int = 2) -> List[Dict]:
    config = WEBSITE_SCRAPERS_CONFIG.get(site_key)
    if not config: return []
    
    properties = []
    endpoint = config['endpoints'].get(property_type.lower())
    if not endpoint: return []

    base_url = config['base_url']
    
    for page in range(1, max_pages + 1):
        # Pagination logic can be complex, this is a simplified example
        paginated_endpoint = endpoint if '?' in endpoint else f"{endpoint}?page={page}"
        url = urljoin(base_url, paginated_endpoint)
        
        try:
            headers = get_random_headers()
            proxy = get_random_proxy()
            logger.info(f"Scraping {site_key} (Page {page})...")
            
            response = await asyncio.to_thread(
                requests.get, url, headers=headers, proxies=proxy, timeout=25
            )
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            listing_containers = soup.select(config['listing_selector'])
            if not listing_containers: break

            for item in listing_containers:
                # ... (logic from previous version to extract data using config selectors)
                title = (item.select_one(config['title_selector']) or {}).text.strip()
                # ... etc for other fields
                
                prop = {
                    "source": site_key,
                    "title": title,
                    #... populate other fields
                }
                properties.append(prop)

        except Exception as e:
            logger.error(f"Error scraping {site_key}: {e}")
            break # Stop on error for this site
            
    return properties

# --- Social Media Scrapers ---
# NOTE: These are complex and require significant setup (cookies, logins, robust error handling)
# The following are high-level implementations.

@cache_decorator()
async def scrape_facebook_groups(location: str, property_type: str, max_posts: int = 20) -> List[Dict]:
    logger.info("Starting Facebook scraper...")
    # This is a placeholder for a complex Playwright implementation
    return [{"source": "Facebook Group", "title": "Placeholder FB Listing", "price": "£1000/month"}]

@cache_decorator()
async def scrape_instagram_accounts(max_posts: int = 15) -> List[Dict]:
    logger.info("Starting Instagram scraper...")
    # Placeholder for Playwright/API implementation
    return [{"source": "Instagram", "title": "Placeholder IG Listing", "price": "£250,000"}]

@cache_decorator()
async def scrape_telegram_channels(max_messages: int = 50) -> List[Dict]:
    logger.info("Starting Telegram scraper...")
    if not all([TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_PHONE]):
        logger.warning("Telegram credentials not configured. Skipping.")
        return []
    
    properties = []
    # Placeholder for Telethon implementation
    return properties

# --- Master Orchestration Function ---
async def find_all_properties(location: str, property_type: str) -> List[Dict]:
    """
    Asynchronous master function that orchestrates all scrapers.
    """
    if property_type.lower() not in ['rent', 'sale']:
        raise ValueError("property_type must be 'rent' or 'sale'")

    logger.info(f"--- Starting FULL property search for '{property_type}' in '{location}' ---")
    
    # Create tasks for all scrapers
    tasks = []
    for site_key in WEBSITE_SCRAPERS_CONFIG:
        tasks.append(scrape_generic_website(site_key, location, property_type))
        
    tasks.append(scrape_facebook_groups(location, property_type))
    tasks.append(scrape_instagram_accounts())
    tasks.append(scrape_telegram_channels())
    
    # Run all tasks concurrently and gather results
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Process results, filtering out errors
    all_properties = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            # You can get more info about which task failed if needed
            logger.error(f"A scraper task failed: {result}")
        elif result:
            all_properties.extend(result)
            
    # Clean and finalise the data
    all_properties = deduplicate_properties(all_properties)
    # Re-run filter for safety, though individual scrapers might do this
    all_properties = filter_properties_by_keywords(all_properties, location, property_type)
    
    logger.info(f"--- Finished search. Found {len(all_properties)} unique properties. ---")
    
    return all_properties

def sync_find_all_properties(*args, **kwargs):
    """Synchronous wrapper to run the async master function from Django views/tools."""
    return asyncio.run(find_all_properties(*args, **kwargs))