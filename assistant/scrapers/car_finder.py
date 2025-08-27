# assistant/scrapers/car_finder.py

import asyncio
import logging
import requests
from bs4 import BeautifulSoup
from typing import List, Dict
from .property_finder import get_random_headers, get_random_proxy, deduplicate_properties, cache_decorator

logger = logging.getLogger(__name__)

# --- Configuration for Known Car Websites ---
CAR_WEBSITES_CONFIG = {
    'kktcarabam': {
        'base_url': 'https://www.kktcarabam.com',
        'endpoint': '/ilanlar',
        'listing_selector': 'tr.list-item',
        'title_selector': 'a.title',
        'price_selector': 'td.price-td',
        'image_selector': 'img.listing-image',
        'url_selector': 'a.title',
    },
    # We can add more sites like 'arabamkibris.com' here later
}

# --- Generic Scraper for Cars ---
@cache_decorator()
async def scrape_generic_car_website(site_key: str, make: str = None) -> List[Dict]:
    config = CAR_WEBSITES_CONFIG.get(site_key)
    if not config: return []
    
    properties = []
    url = config['base_url'] + config['endpoint']
    
    try:
        logger.info(f"Scraping {site_key} for cars...")
        response = await asyncio.to_thread(
            requests.get, url, headers=get_random_headers(), proxies=get_random_proxy(), timeout=20
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        listings = soup.select(config['listing_selector'])
        for item in listings[:10]: # Limit to 10 results per site
            title = (item.select_one(config['title_selector']) or {}).text.strip()
            price = (item.select_one(config['price_selector']) or {}).text.strip()
            details_url = item.select_one(config['url_selector'])
            image_url = item.select_one(config['image_selector'])

            if not title or not price: continue

            prop = {
                "source": site_key,
                "title": title,
                "price": price,
                "details_url": config['base_url'] + details_url['href'] if details_url else None,
                "image_url": image_url['src'] if image_url else None,
            }
            properties.append(prop)
    except Exception as e:
        logger.error(f"Error scraping car site {site_key}: {e}")
        
    return properties

# --- Master Car Finder Function ---
async def find_all_cars(make: str = None, model: str = None) -> List[Dict]:
    logger.info(f"--- Starting FULL car search for make: {make} ---")
    tasks = []
    for site_key in CAR_WEBSITES_CONFIG:
        tasks.append(scrape_generic_car_website(site_key, make))
        
    # Placeholder for Facebook car scraping
    # tasks.append(scrape_facebook_cars(make, model))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_cars = []
    for result in results:
        if not isinstance(result, Exception):
            all_cars.extend(result)
            
    # Here you could add more advanced filtering based on make/model
    
    logger.info(f"--- Finished car search. Found {len(all_cars)} total listings. ---")
    return all_cars

def sync_find_all_cars(*args, **kwargs):
    return asyncio.run(find_all_cars(*args, **kwargs))