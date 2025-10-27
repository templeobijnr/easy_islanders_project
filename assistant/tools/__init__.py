# assistant/tools/__init__.py
"""
Easy Islanders — Tools Module
=============================

These are the “bridge” functions the AI brain (assistant/ai_assistant.py) can call
via OpenAI function-calling. Each tool connects the model’s intent to a concrete
backend capability (DB query, web scraping, outreach, etc.).

Design principles:
- **Privacy-safe, source-agnostic UI**: Never leak where we found a listing. We only
  return neutral, internal-friendly fields that your frontend cards already use.
- **Fast path first**: `search_internal_listings` is the primary tool. It hits our
  Listing DB (fed by Devi AI webhook + scrapers).
- **Live hunt second**: If internal search is empty (or user asks for fresh),
  the AI may call `find_rental_property` / `find_used_car` (slower).
- **Knowledge & services**: Curated KB and vetted service providers.
- **Outreach**: `initiate_contact_with_seller` stubs a platform-agnostic contact flow.

Return shape:
-------------
All tools return a dict. For search tools:

{
  "success": bool,
  "count": int,
  "data": [ { ...items suitable for RecommendationCard... } ]
}

Where each item for property/car cards is intentionally **platform-agnostic** and
may include (depending on data availability):

- id: str (internal listing id)
- title: str
- description: str
- location: str
- price: str (e.g., "550 GBP")
- image_url: str | None
- details_url: str (internal route, e.g., "/listings/<id>")
- features: list[str]

IMPORTANT: We **omit** any external “source/provider” field by design.
"""

from __future__ import annotations

import logging
import random
import re
from datetime import datetime, timezone as dt_timezone
from typing import Any, Dict, List, Optional

import requests
from bs4 import BeautifulSoup
from django.conf import settings
from django.db import transaction
from django.db.models import Q

from assistant.models import KnowledgeBase, ServiceProvider
from listings.models import Listing
from assistant.serializers import KnowledgeBaseSerializer, ServiceProviderSerializer
from assistant.twilio_client import TwilioWhatsAppClient
from assistant.models import ContactIndex

logger = logging.getLogger(__name__)


def has_contact_info(listing) -> bool:
    """
    Check if a listing has valid contact information for outreach.
    
    Args:
        listing: Listing model instance
        
    Returns:
        bool: True if listing has contact info, False otherwise
    """
    try:
        sd = listing.structured_data or {}
        
        # Check structured_data contact_info
        contact_info = sd.get("contact_info")
        if contact_info:
            # If it's a string, check if it's not empty
            if isinstance(contact_info, str) and contact_info.strip():
                return True
            # If it's a dict, check if it has any contact fields
            elif isinstance(contact_info, dict):
                contact_fields = ["whatsapp", "phone", "contact_number", "tel", "telegram"]
                if any(contact_info.get(field) for field in contact_fields):
                    return True
        
        # Check model-level contact fields
        if listing.contact_identifier and listing.contact_identifier.strip():
            return True
        
        # Check raw_text for phone patterns
        if listing.raw_text:
            phone_patterns = [
                r'\+90\d{10}',  # Turkish mobile
                r'\+90\d{11}',  # Turkish landline
                r'\d{10}',      # 10 digits
                r'\d{11}',      # 11 digits
                r'\+?\d[\d\s\-]{7,}'  # General phone pattern
            ]
            for pattern in phone_patterns:
                if re.search(pattern, listing.raw_text):
                    return True
        
        return False
    except Exception as e:
        logger.error(f"Error checking contact info for listing {listing.id}: {e}")
        return False
# -------------------------------------------------------------------
# Multilingual synonyms for heuristics
# -------------------------------------------------------------------

_FURNISHED_TRUE_KEYWORDS = [
    "furnished", "eşyalı", "esyalı", "möblierte", "меблирован", "umeblowane"
]
_FURNISHED_FALSE_KEYWORDS = [
    "unfurnished", "eşyasız", "esyasiz", "unmöbliert", "без мебели", "nieumeblowane"
]
_PETS_ALLOWED_KEYWORDS = [
    "pets", "pet friendly", "pets allowed", "evcil hayvan", "hayvan kabul", "домашние животные"
]
_DURATION_DAILY = ["daily", "günlük", "gunluk", "tageweise", "na dzień", "ежедневно"]
_DURATION_MONTHLY = ["monthly", "aylık", "aylik", "monatlich", "miesięcznie", "ежемесячно"]
_DURATION_LONG = ["long term", "uzun dönem", "uzun donem", "langfristig", "długoterminowy", "долгосрочно"]



__all__ = [
    "search_internal_listings",
    "search_services",
    "get_knowledge",
    "find_rental_property",
    "find_used_car",
    "perform_google_search",
    "initiate_contact_with_seller",
]

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------


def _ua_headers() -> Dict[str, str]:
    """Generate simple random-ish headers for polite scraping."""
    uas = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/16.1 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    ]
    return {
        "User-Agent": random.choice(uas),
        "Accept-Language": "en-GB,en;q=0.9,tr;q=0.8,ru;q=0.7,de;q=0.6,pl;q=0.5",
        "Cache-Control": "no-cache",
    }


_LOCATION_ALIASES = {
    # TRNC common synonyms/romanizations
    "girne": "kyrenia",
    "kyrenia": "kyrenia",
    "çatalköy": "catalkoy",
    "catalkoy": "catalkoy",
    "lefkoşa": "nicosia",
    "lefkosha": "nicosia",
    "nicosia": "nicosia",
    "gazimağusa": "famagusta",
    "gazimagusa": "famagusta",
    "famagusta": "famagusta",
    "iskele": "iskele",
    "esentepe": "esentepe",
    "alsancak": "alsancak",
    "lapta": "lapta",
    "karşıyaka": "karsiyaka",
    "karsiyaka": "karsiyaka",
}

# Regions and their common nearby/child areas for graceful fallback
_REGION_NEARBY = {
    "kyrenia": ["kyrenia", "girne", "catalkoy", "alsancak", "lapta", "karakum", "ozankoy", "esentepe", "karsiyaka"],
}


def _normalize_location(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    t = text.strip().lower()
    return _LOCATION_ALIASES.get(t, t)


def _parse_bedrooms_from_text(text: Optional[str]) -> Optional[int]:
    """
    Extract bedrooms from common shorthand:
    - '2+1', '3 + 1'
    - '2 bed', '2 bedroom(s)'
    """
    if not text:
        return None
    t = text.lower()

    m = re.search(r"(\d+)\s*\+\s*1", t)
    if m:
        try:
            return int(m.group(1))
        except Exception:
            pass

    m = re.search(r"(\d+)\s*(bed|bedroom|bedrooms)\b", t)
    if m:
        try:
            return int(m.group(1))
        except Exception:
            pass

    return None


def _infer_listing_type(raw: Optional[str]) -> str:
    """Heuristic fallback when DB.listing_type is empty."""
    t = (raw or "").lower()
    if any(k in t for k in ["rent", "kira", "kiralık", "kiralik"]):
        return "property_rent"
    if any(k in t for k in ["sale", "satılık", "satilik", "sell"]):
        return "property_sale"
    return "property_rent"


def _format_price(price: Optional[float], currency: Optional[str]) -> str:
    if price is None:
        return ""
    c = (currency or "").strip().upper()
    return f"{price:g} {c}" if c else f"{price:g}"


def _first_image(sd: Dict[str, Any]) -> Optional[str]:
    """
    Try typical keys in structured data: image_urls, images, photos.
    Expect list[str] or str. Convert relative paths to API URLs.
    """
    candidates = []
    for key in ("image_urls", "images", "photos", "image"):
        val = sd.get(key)
        if isinstance(val, list) and val:
            candidates.extend([x for x in val if isinstance(x, str)])
        elif isinstance(val, str):
            candidates.append(val)
    
    if not candidates:
        return None
    
    # Filter out placeholder or non-listing media; prefer listing-scoped media
    filtered: List[str] = []
    for u in candidates:
        if not isinstance(u, str) or not u.strip():
            continue
        s = u.strip()
        if s.startswith("http://") or s.startswith("https://"):
            filtered.append(s)
        elif s.startswith("/listings/"):
            filtered.append(s)
        elif s.startswith("/media/"):
            # only accept listing-scoped media paths
            if "/media/listings/" in s:
                filtered.append(s)
            else:
                # skip bare /media/test.jpg or similar placeholders
                continue
        else:
            # unknown shape; keep as last resort
            filtered.append(s)

    if not filtered:
        return None

    # Convert relative paths to API URLs
    first_url = filtered[0]
    if not first_url.startswith('http'):
        # Ensure the path starts with a slash and follows the correct API route
        if not first_url.startswith('/'):
            first_url = '/' + first_url
        if first_url.startswith('/media/'):
            # Let frontend/API base URL resolve this media path directly
            return first_url
        # Handle older /listings/{id}/media format
        elif first_url.startswith('/listings/'):
            path_parts = first_url.strip('/').split('/')
            if len(path_parts) >= 4 and path_parts[0] == 'listings' and path_parts[2] == 'media':
                listing_id_from_path = path_parts[1]
                filename = path_parts[3]
                return f"/api/listings/{listing_id_from_path}/media/{filename}"

    return first_url


# -------------------------------------------------------------------
# Primary: Internal search (fast path)
# -------------------------------------------------------------------


def search_internal_listings(
    listing_type: str,
    location: Optional[str] = None,
    previous_listing_id: Optional[str] = None,
    attributes: Optional[Dict[str, Any]] = None,
    language: str = "en",
) -> Dict[str, Any]:
    """
    PRIMARY tool — query our internal Listing DB (fed by Devi + scrapers).

    Parameters
    ----------
    listing_type : str
        Expected values like "property_rent", "property_sale", "car_sale".
        We match with icontains and also infer from raw text when needed.
    location : str, optional
        User-stated area (e.g., "Girne"). We normalize to "Kyrenia" for matching.
    previous_listing_id : str, optional
        If present, bias search towards similar items (same area/bedrooms).
    attributes : dict, optional
        Additional filters:
          - beds: int
          - max_price: float|int
          - query: raw user query (to parse "2+1" etc.)
    language : str
        Unused here but part of tool signature.

    Returns
    -------
    dict:
        { "success": bool, "count": int, "data": [cards...] }
    """
    try:
        attributes = attributes or {}
        norm_loc = _normalize_location(location) if location else None
        requested_beds = attributes.get("beds")
        max_price = attributes.get("max_price")
        text_query = attributes.get("query")
        wanted_features: Optional[List[str]] = attributes.get("features") if isinstance(attributes.get("features"), list) else None
        furnished: Optional[bool] = attributes.get("furnished") if isinstance(attributes.get("furnished"), bool) else None
        pets_allowed: Optional[bool] = attributes.get("pets_allowed") if isinstance(attributes.get("pets_allowed"), bool) else None
        duration: Optional[str] = attributes.get("duration")

        if not requested_beds and text_query:
            requested_beds = _parse_bedrooms_from_text(text_query)

        qs = Listing.objects.filter(is_active=True)

        # Listing type filter (robust)
        if listing_type:
            qs = qs.filter(Q(listing_type__icontains=listing_type))
        else:
            # heuristic fallback
            qs = qs.filter(
                Q(listing_type__icontains="rent")
                | Q(raw_text__icontains="rent")
                | Q(raw_text__icontains="kiralık")
                | Q(raw_text__icontains="kiralik")
            )

        # Text query filter (broad, keyword-based)
        if text_query:
            keywords = text_query.split()
            q_objects = Q()
            for keyword in keywords:
                q_objects |= (
                    Q(raw_text__icontains=keyword)
                    | Q(location__icontains=keyword)
                    | Q(structured_data__title__icontains=keyword)
                    | Q(structured_data__description__icontains=keyword)
                    | Q(structured_data__features__icontains=keyword)
                )
            qs = qs.filter(q_objects)

        # If “similar to previous listing” requested
        base_beds = None
        base_loc = None
        if previous_listing_id:
            try:
                base = Listing.objects.get(id=previous_listing_id)
                sd = base.structured_data or {}
                base_beds = sd.get("bedrooms")
                base_loc = sd.get("location") or base.location
            except Listing.DoesNotExist:
                pass

        # Location constraint
        effective_loc = _normalize_location(norm_loc or base_loc)
        if effective_loc:
            qs = qs.filter(
                Q(location__icontains=effective_loc)
                | Q(structured_data__location__icontains=effective_loc)
                | Q(raw_text__icontains=effective_loc)
            )

        # Bedroom filter
        effective_beds = requested_beds or base_beds
        if effective_beds:
            qs = qs.filter(
                Q(structured_data__bedrooms=effective_beds)
                | Q(raw_text__icontains=f"{effective_beds}+1")
            )

        # Price filter
        if max_price is not None:
            try:
                mp = float(max_price)
                qs = qs.filter(price__isnull=False, price__lte=mp)
            except Exception:
                pass

        # Feature/amenity keyword filter (e.g., "private pool", "sea view")
        if wanted_features:
            for feat in wanted_features:
                if not feat:
                    continue
                f = str(feat).strip()
                qs = qs.filter(
                    Q(structured_data__features__icontains=f)
                    | Q(structured_data__amenities__icontains=f)
                    | Q(raw_text__icontains=f)
                    | Q(structured_data__description__icontains=f)
                )

        # Furnished filter (heuristic if structured key missing)
        if furnished is not None:
            if furnished:
                cond = Q(structured_data__furnished=True)
                for kw in _FURNISHED_TRUE_KEYWORDS:
                    cond |= Q(raw_text__icontains=kw) | Q(structured_data__description__icontains=kw)
                qs = qs.filter(cond)
            else:
                cond = Q(structured_data__furnished=False)
                for kw in _FURNISHED_FALSE_KEYWORDS:
                    cond |= Q(raw_text__icontains=kw) | Q(structured_data__description__icontains=kw)
                qs = qs.filter(cond)

        # Pets allowed filter
        if pets_allowed is not None:
            if pets_allowed:
                cond = Q(structured_data__pets_allowed=True)
                for kw in _PETS_ALLOWED_KEYWORDS:
                    cond |= Q(raw_text__icontains=kw) | Q(structured_data__description__icontains=kw)
                qs = qs.filter(cond)
            else:
                # If explicitly not allowed, exclude ones that say pets allowed
                cond = Q(structured_data__pets_allowed=False)
                for kw in _PETS_ALLOWED_KEYWORDS:
                    qs = qs.exclude(Q(raw_text__icontains=kw) | Q(structured_data__description__icontains=kw))
                qs = qs.filter(cond)

        # Duration filter
        if duration:
            d = duration.strip().lower()
            cond = Q(structured_data__duration__iexact=d)
            kws = []
            if d in ("daily", "short_term"):
                kws = _DURATION_DAILY
            elif d in ("monthly", "long_term"):
                kws = _DURATION_MONTHLY + _DURATION_LONG
            for kw in kws:
                cond |= Q(raw_text__icontains=kw) | Q(structured_data__description__icontains=kw)
            qs = qs.filter(cond)

        qs = qs.order_by("-last_seen_at")[:25]

        # Filter out listings without contact information
        listings_with_contact = []
        for lst in qs:
            if has_contact_info(lst):
                listings_with_contact.append(lst)
            else:
                logger.info(f"Filtering out listing {lst.id} - no contact information")

        cards: List[Dict[str, Any]] = []
        for lst in listings_with_contact:
            sd = lst.structured_data or {}
            # Resolve a reasonable title/desc
            title = (
                sd.get("title")
                or (
                    f"{sd.get('bedrooms', '')}+1 in {sd.get('location') or lst.location or 'North Cyprus'}".strip()
                )
                or "Listing"
            )
            desc = sd.get("description") or ((lst.raw_text or "")[:280] + "…") if lst.raw_text else ""

            lt = lst.listing_type or sd.get("listing_type") or _infer_listing_type(lst.raw_text)

            cards.append(
                {
                    "id": str(lst.id),
                    "title": title,
                    "description": desc,
                    "location": sd.get("location") or lst.location or "North Cyprus",
                    "price": _format_price(lst.price, lst.currency),
                    "images": [_first_image(sd)] if _first_image(sd) else [], # Use 'images' array for consistency
                    "details_url": f"/listings/{lst.id}",  # internal safe URL
                    "features": [f"{sd.get('bedrooms')} bedrooms" if sd.get("bedrooms") else None,
                                 lt.replace("_", " ").title() if lt else None],
                }
            )

        # Clean up None features
        for c in cards:
            c["features"] = [f for f in c.get("features", []) if f]

        meta: Dict[str, Any] = {}

        # Graceful fallback: broaden to region-level if no results
        if len(cards) == 0 and norm_loc:
            region = None
            # Find region bucket containing norm_loc
            for reg, areas in _REGION_NEARBY.items():
                if norm_loc in areas:
                    region = reg
                    break
            if region:
                base_qs = Listing.objects.filter(is_active=True)
                # Listing type filter retained
                if listing_type:
                    base_qs = base_qs.filter(Q(listing_type__icontains=listing_type))
                # Bedrooms and price and features retained
                if requested_beds:
                    base_qs = base_qs.filter(
                        Q(structured_data__bedrooms=requested_beds)
                        | Q(raw_text__icontains=f"{requested_beds}+1")
                    )
                if max_price is not None:
                    try:
                        mp = float(max_price)
                        base_qs = base_qs.filter(price__isnull=False, price__lte=mp)
                    except Exception:
                        pass
                if wanted_features:
                    for feat in wanted_features:
                        if not feat:
                            continue
                        f = str(feat).strip()
                        base_qs = base_qs.filter(
                            Q(structured_data__features__icontains=f)
                            | Q(structured_data__amenities__icontains=f)
                            | Q(raw_text__icontains=f)
                            | Q(structured_data__description__icontains=f)
                        )
                # Region-wide location ORs
                cond = Q()
                for area in _REGION_NEARBY.get(region, []):
                    cond |= Q(location__icontains=area) | Q(structured_data__location__icontains=area) | Q(raw_text__icontains=area)
                base_qs = base_qs.filter(cond).order_by("-last_seen_at")[:25]

                # Filter fallback results by contact info too
                for lst in base_qs:
                    if not has_contact_info(lst):
                        logger.info(f"Filtering out fallback listing {lst.id} - no contact information")
                        continue
                    sd = lst.structured_data or {}
                    title = (
                        sd.get("title")
                        or (
                            f"{sd.get('bedrooms', '')}+1 in {sd.get('location') or lst.location or 'North Cyprus'}".strip()
                        )
                        or "Listing"
                    )
                    desc = sd.get("description") or ((lst.raw_text or "")[:280] + "…") if lst.raw_text else ""
                    lt = lst.listing_type or sd.get("listing_type") or _infer_listing_type(lst.raw_text)
                    cards.append(
                        {
                            "id": str(lst.id),
                            "title": title,
                            "description": desc,
                            "location": sd.get("location") or lst.location or "North Cyprus",
                            "price": _format_price(lst.price, lst.currency),
                            "images": [_first_image(sd)] if _first_image(sd) else [], # Use 'images' array for consistency
                            "details_url": f"/listings/{lst.id}",
                            "features": [f"{sd.get('bedrooms')} bedrooms" if sd.get("bedrooms") else None,
                                         lt.replace("_", " ").title() if lt else None],
                        }
                    )
                # Clean None
                for c in cards:
                    c["features"] = [f for f in c.get("features", []) if f]
                if cards:
                    meta = {"broadened": True, "from": norm_loc, "to": region}

        logger.info("search_internal_listings", extra={
            "listing_type": listing_type,
            "location": norm_loc,
            "beds": requested_beds,
            "max_price": max_price,
            "features": wanted_features,
            "furnished": furnished,
            "pets_allowed": pets_allowed,
            "duration": duration,
            "count": len(cards),
            "broadened": meta.get("broadened", False),
            "broaden_from": meta.get("from"),
            "broaden_to": meta.get("to"),
        })
        return {"success": True, "count": len(cards), "data": cards, "meta": meta}

    except Exception as e:
        logger.exception("search_internal_listings failed")
        return {"success": False, "error": str(e), "count": 0, "data": []}


# -------------------------------------------------------------------
# Services & Knowledge
# -------------------------------------------------------------------


def search_services(
    category: str,
    location: Optional[str] = None,
    language: str = "en",
    **kwargs,
) -> Dict[str, Any]:
    """
    Find vetted service providers (lawyers, doctors, rentals, etc.).

    Returns serializer output, which your frontend can render as cards
    (with name, description, price_range, rating, image_url, booking_url).
    """
    try:
        qs = ServiceProvider.objects.filter(is_active=True, category__iexact=category)
        if location:
            qs = qs.filter(location__icontains=location)
        qs = qs.order_by("-is_featured", "-rating")[:10]
        serializer = ServiceProviderSerializer(qs, many=True, context={"language": language})
        return {"success": True, "count": len(serializer.data), "data": serializer.data}
    except Exception as e:
        logger.exception("search_services failed")
        return {"success": False, "error": str(e), "count": 0, "data": []}


def get_knowledge(topic: str, language: str = "en", **kwargs) -> Dict[str, Any]:
    """
    Retrieve curated KB articles for how-to / factual queries.
    """
    try:
        qs = KnowledgeBase.objects.filter(is_active=True).filter(
            Q(title__icontains=topic)
            | Q(keywords__icontains=topic)
            | Q(content_en__icontains=topic)
        )[:5]
        if not qs.exists():
            return {"success": True, "count": 0, "data": []}
        serializer = KnowledgeBaseSerializer(qs, many=True, context={"language": language})
        return {"success": True, "count": len(serializer.data), "data": serializer.data}
    except Exception as e:
        logger.exception("get_knowledge failed")
        return {"success": False, "error": str(e), "count": 0, "data": []}


# -------------------------------------------------------------------
# Live hunts (scrapers)
# -------------------------------------------------------------------


def find_rental_property(
    location: str,
    property_type: str,
    beds: Optional[int] = None,
    max_rent: Optional[int] = None,
    language: str = "en",
) -> Dict[str, Any]:
    """
    Trigger live scraping for rentals (e.g., 101evler).
    `sync_find_all_properties` should return a list[dict] with reasonable fields.

    NOTE: Keep return shape consistent with frontend. If scrapers return raw shape,
    we pass it through. You can transform to card shape here if needed.
    """
    try:
        norm_loc = _normalize_location(location) or location
        # Your scraper likely expects "rent"/"sale" instead of "apartment/villa" etc.
        # Here we bias to rentals since the tool is 'find_rental_property'.
        scraped = sync_find_all_properties(location=norm_loc, property_type="rent")

        if not scraped:
            return {"success": True, "count": 0, "data": []}

        # Optional: apply beds/max_rent client-side filtering if scraper returns price & bedrooms
        filtered = []
        for it in scraped:
            keep = True
            if beds is not None:
                b = it.get("bedrooms") or it.get("beds")
                if b is not None and str(b).isdigit() and int(b) != int(beds):
                    keep = False
            if keep and max_rent is not None:
                p = it.get("price")
                try:
                    if isinstance(p, (int, float)) and float(p) > float(max_rent):
                        keep = False
                except Exception:
                    pass
            if keep:
                filtered.append(it)

        return {"success": True, "count": len(filtered), "data": filtered}
    except Exception as e:
        logger.exception("find_rental_property failed")
        return {"success": False, "error": str(e), "count": 0, "data": []}


def find_used_car(
    make: Optional[str] = None,
    model: Optional[str] = None,
    budget: Optional[int] = None,
    language: str = "en",
) -> Dict[str, Any]:
    """
    Trigger live scraping for used cars in TRNC.
    """
    try:
        scraped = sync_find_all_cars(make=make, model=model)  # your scraper handles filters
        if not scraped:
            return {"success": True, "count": 0, "data": []}

        # Optional: budget filter
        if budget is not None:
            filtered = []
            for it in scraped:
                p = it.get("price")
                try:
                    if p is None or float(p) <= float(budget):
                        filtered.append(it)
                except Exception:
                    # if unparsable, keep it
                    filtered.append(it)
            scraped = filtered

        return {"success": True, "count": len(scraped), "data": scraped}
    except Exception as e:
        logger.exception("find_used_car failed")
        return {"success": False, "error": str(e), "count": 0, "data": []}


# -------------------------------------------------------------------
# Fallback web search (niche discovery)
# -------------------------------------------------------------------


def perform_google_search(query: str, language: str = "en") -> Dict[str, Any]:
    """
    Lightweight Google SERP fetcher to discover niche sources.
    WARNING: Google’s markup changes frequently; treat this as best-effort.

    Returns top 5 {title, link, snippet}.
    """
    try:
        q = f"{query} in North Cyprus"
        params = {"q": q, "hl": language}
        r = requests.get("https://www.google.com/search", params=params, headers=_ua_headers(), timeout=12)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")

        results: List[Dict[str, str]] = []
        for block in soup.select("div.g"):
            a = block.find("a", href=True)
            h3 = block.find("h3")
            if not a or not h3:
                continue
            link = a["href"]
            title = h3.get_text(strip=True)
            # Very fragile; try common snippet containers
            snippet = ""
            snip_div = block.select_one("div.VwiC3b") or block.select_one("span.aCOpRe")
            if snip_div:
                snippet = snip_div.get_text(" ", strip=True)
            if link.startswith("http"):
                results.append({"title": title, "link": link, "snippet": snippet})

        if not results:
            return {"success": True, "count": 0, "data": []}

        return {"success": True, "count": len(results[:5]), "data": results[:5]}
    except Exception as e:
        logger.exception("perform_google_search failed")
        return {"success": False, "error": str(e), "count": 0, "data": []}


# -------------------------------------------------------------------
# Outreach / Proxy Agent action
# -------------------------------------------------------------------


def initiate_contact_with_seller(
    listing_id: int,
    channel: str = "whatsapp",
    language: str = "en",
    conversation_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Kick off outreach to a seller **without** revealing source/platform to the end user.

    Minimal assumptions (no model changes required):
    - We try to obtain contact info from Listing.structured_data["contact_info"] (common keys:
      "phone", "whatsapp", "contact_number").
    - If contact info exists, we *stub* a provider call (e.g., Twilio WhatsApp Business API)
      and record the attempt into structured_data["outreach"].

    NOTE:
    - This is a safe, platform-agnostic stub. Replace the commented block with your provider’s API.
    - We do NOT modify any non-existent `status`/`contact_*` fields on Listing; instead we store
      an `outreach` object inside structured_data to keep a simple audit trail.

    Returns
    -------
    dict:
        {"ok": True/False, "data": [...], "reason"?: str, "error"?: str}
    """
    try:
        with transaction.atomic():
            lst = Listing.objects.select_for_update().get(id=listing_id)
            sd = (lst.structured_data or {}).copy()
            contact = sd.get("contact_info") or {}
            # Normalize contact to dict if it's a raw string
            if isinstance(contact, str):
                # very light parse: assume it's a number-like string
                contact = {"contact_number": contact.strip()}

            # Try common contact keys
            candidate = (
                (isinstance(contact, dict) and (
                    contact.get("whatsapp")
                    or contact.get("phone")
                    or contact.get("contact_number")
                    or contact.get("tel")
                    or contact.get("telegram")
                )) or None
            )
            # NEW: If candidate is still a dict, select a preferred string value
            if isinstance(candidate, dict):
                candidate = candidate.get("whatsapp") or candidate.get("phone") or candidate.get("contact_number")
                if not isinstance(candidate, str) or not candidate.strip():
                    return {"ok": False, "reason": "invalid_contact", "error": "No valid string contact found in dict"}
            
            # If still nothing, try a very rough regex on raw_text
            if not candidate and lst.raw_text:
                m = re.search(r"(\+?\d[\d\s\-]{7,})", lst.raw_text)
                if m:
                    candidate = m.group(1).strip()
            
            # Sandbox/testing override: force all sends to a single test number
            test_to = getattr(settings, "TWILIO_TEST_TO", None)
            if not test_to:
                import os
                test_to = os.getenv("TWILIO_TEST_TO")
            if test_to:
                candidate = str(test_to).strip()
            
            if candidate:
                # Maintain reverse index for inbound mapping
                try:
                    norm = ''.join(ch for ch in str(candidate) if ch.isdigit() or ch == '+')
                    conversation = None
                    if conversation_id:
                        from assistant.models import Conversation
                        try:
                            conversation = Conversation.objects.get(id=conversation_id)
                        except Conversation.DoesNotExist:
                            logger.warning(f"Conversation {conversation_id} not found for ContactIndex")
                    
                    # Create or update ContactIndex with conversation context
                    contact_index, created = ContactIndex.objects.get_or_create(
                        normalized_contact=norm, 
                        listing=lst,
                        defaults={'conversation': conversation}
                    )
                    
                    # Always update conversation if provided (for better context resolution)
                    if conversation and contact_index.conversation != conversation:
                        contact_index.conversation = conversation
                        contact_index.save()
                    
                    logger.info(f"ContactIndex {'created' if created else 'updated'}: {norm} → listing {listing_id}, conversation {conversation_id}")
                except Exception:
                    logger.exception("Failed to index contact→listing")
            if not candidate:
                return {"ok": False, "reason": "no_contact", "data": []}

            # Multilingual message templates
            messages = {
                "en": "Hello! This is Easy Islanders. A client is interested in your property. Could you please share a few photos and confirm availability? Thank you!",
                "ru": "Привет! Это Easy Islanders. Клиент заинтересован в вашей недвижимости. Не могли бы вы поделиться несколькими фотографиями и подтвердить доступность? Спасибо!",
                "pl": "Cześć! To Easy Islanders. Klient jest zainteresowany Twoją nieruchomością. Czy mógłbyś udostępnić kilka zdjęć i potwierdzić dostępność? Dziękuję!",
                "de": "Hallo! Das ist Easy Islanders. Ein Kunde ist an Ihrer Immobilie interessiert. Könnten Sie bitte einige Fotos teilen und die Verfügbarkeit bestätigen? Vielen Dank!",
                "tr": "Merhaba! Bu Easy Islanders. Bir müşteri mülkünüzle ilgileniyor. Birkaç fotoğraf paylaşabilir ve müsaitliği onaylayabilir misiniz? Teşekkürler!"
            }
            
            text = messages.get(language, messages["en"])

            # Attempt real send via Twilio client (falls back to stub if not configured)
            send_status = "queued"
            message_sid = None
            try:
                twilio = TwilioWhatsAppClient()
                result = twilio.send_message(candidate, text)
                if isinstance(result, dict) and result.get("success"):
                    message_sid = result.get("message_sid")
                    # If credentials missing, client returns status="stubbed"
                    send_status = result.get("status") or ("sent" if message_sid else "queued")
                    logger.info(f"[Outreach] ({channel}) message sent to {candidate} for Listing#{lst.id} status={send_status}")
                else:
                    logger.error(f"[Outreach] Twilio send failed for Listing#{lst.id}: {result}")
            except Exception:
                logger.exception("[Outreach] Twilio client error; outreach will be recorded as queued")

            # Persist an outreach audit trail inside structured_data
            outreach_entry = {
                "channel": channel,
                "to": candidate,
                "text": text,
                "language": language,
                "at": datetime.now(dt_timezone.utc).isoformat(),
                "status": send_status,
                "outreach_id": f"outreach_{listing_id}_{channel}_{int(datetime.now(dt_timezone.utc).timestamp())}"
            }
            if message_sid:
                outreach_entry["message_sid"] = message_sid
            
            # NEW: Add follow_up_at for monitoring (24 hours from now)
            from datetime import timedelta
            outreach_entry["follow_up_at"] = (datetime.now(dt_timezone.utc) + timedelta(hours=24)).isoformat()
            
            existing = sd.get("outreach") or []
            if not isinstance(existing, list):
                existing = [existing]
            existing.append(outreach_entry)
            sd["outreach"] = existing
            lst.structured_data = sd
            lst.save(update_fields=["structured_data"])

        return {"ok": True, "data": [{"listing_id": listing_id, "outreach": "queued", "outreach_id": outreach_entry["outreach_id"]}]}
    except Listing.DoesNotExist:
        return {"ok": False, "reason": "not_found", "data": []}
    except Exception as e:
        logger.exception("initiate_contact_with_seller failed")
        return {"ok": False, "reason": "error", "error": str(e), "data": []}


def check_for_new_images(
    listing_id: int,
    outreach_timestamp: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Check if new images have been received for a listing since the outreach timestamp.
    
    Parameters
    ----------
    listing_id : int
        The ID of the listing to check.
    outreach_timestamp : str, optional
        ISO-formatted timestamp of when the outreach was sent.
        If not provided, returns current image status without time comparison.
    
    Returns
    -------
    dict:
        {"success": bool, "has_new_images": bool, "image_count": int, "new_images": list[str], "error"?: str}
    """
    try:
        lst = Listing.objects.get(id=listing_id)
        sd = lst.structured_data or {}
        
        # Get images (always available)
        images = sd.get('image_urls', [])
        current_count = len(images)
        
        # If no timestamp provided, return current status
        if not outreach_timestamp:
            result = {
                "success": True,
                "has_new_images": current_count > 0,
                "image_count": current_count,
                "image_urls": images,  # Fix: use image_urls instead of new_images
                "new_images": images
            }
            logger.critical(f"DEBUG check_for_new_images (no timestamp) for listing {listing_id}: {result}")
            return result
        
        # Parse the outreach timestamp
        try:
            outreach_dt = datetime.fromisoformat(outreach_timestamp).replace(tzinfo=dt_timezone.utc)
        except ValueError:
            return {"success": False, "error": "Invalid timestamp format"}
        
        # Get last photo update time
        last_update_str = sd.get('last_photo_update')
        if not last_update_str:
            return {"success": True, "has_new_images": False, "image_count": current_count, "new_images": []}
        
        try:
            last_update_dt = datetime.fromisoformat(last_update_str).replace(tzinfo=dt_timezone.utc)
        except ValueError:
            return {"success": False, "error": "Invalid last_photo_update format"}
        
        # Check if update happened after outreach
        has_new = last_update_dt > outreach_dt
        
        return {
            "success": True,
            "has_new_images": has_new,
            "image_count": len(images) if has_new else 0,
            "image_urls": images if has_new else [],  # Fix: use image_urls instead of new_images
            "new_images": images if has_new else []
        }
    except Listing.DoesNotExist:
        return {"success": False, "error": "Listing not found"}
    except Exception as e:
        logger.exception("check_for_new_images failed")
        return {"success": False, "error": str(e)}

__all__ = [
    "search_internal_listings",
    "search_services",
    "get_knowledge",
    "find_rental_property",
    "find_used_car",
    "perform_google_search",
    "initiate_contact_with_seller",
    "check_for_new_images",  # NEW: Add to exports
]
