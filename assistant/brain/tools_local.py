import requests
from functools import lru_cache
import urllib.parse

from .registry import get_registry_client

USER_AGENT_HEADERS = {"User-Agent": "EasyIslanders/1.0 (+support@easyislanders.com)"}

CITY_ALIASES = {
    "kyrenia": "Kyrenia", "girne": "Kyrenia",
    "nicosia": "Nicosia", "lefkosa": "Nicosia", "lefkoşa": "Nicosia", "lefkoşa": "Nicosia",
    "famagusta": "Famagusta", "gazimagusa": "Famagusta", "gazimağusa": "Famagusta", "gazimağusa": "Famagusta",
    "güzelyurt": "Güzelyurt", "guzelyurt": "Güzelyurt", "morphou": "Güzelyurt",
    "iskele": "İskele", "trikomo": "İskele",
}

def normalize_city(name: str):
    if not name:
        return None
    trimmed = name.strip()
    if not trimmed:
        return None

    client = get_registry_client()
    hits = client.search(trimmed, domain="local_info", k=5)
    for hit in hits:
        metadata = hit.get("metadata") or {}
        if metadata.get("city_alias"):
            return hit.get("base_term") or hit.get("localized_term")

    key = trimmed.lower()
    return CITY_ALIASES.get(key) or trimmed


@lru_cache(maxsize=512)
def geocode(query: str):
    """
    Geocode a location query using OpenStreetMap Nominatim.
    Returns (latitude, longitude) tuple or None if not found.
    Results are cached for performance.
    """
    try:
        qs = urllib.parse.urlencode({"q": query, "format": "json", "limit": 1})
        r = requests.get(
            f"https://nominatim.openstreetmap.org/search?{qs}",
            headers={"User-Agent": "EasyIslanders/1.0"},
            timeout=10
        )
        r.raise_for_status()
        results = r.json()
        if results:
            return (float(results[0]["lat"]), float(results[0]["lon"]))
        return None
    except Exception:
        return None


@lru_cache(maxsize=256)
def get_on_duty_pharmacies(city: str):
    """Placeholder for official on-duty pharmacy source integration.
    Returns a list of dicts with keys: name, address, phone.
    """
    # TODO: Integrate local authoritative source
    return []


@lru_cache(maxsize=256)
def find_places(query: str, near: str, limit: int = 5):
    params = {"q": f"{query} near {near}", "format": "json", "limit": limit}
    r = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params=params,
        headers=USER_AGENT_HEADERS,
        timeout=10,
    )
    r.raise_for_status()
    return r.json()


@lru_cache(maxsize=256)
def web_search(query: str):
    params = {"q": query, "format": "json", "no_html": 1, "skip_disambig": 1}
    r = requests.get(
        "https://api.duckduckgo.com/",
        params=params,
        headers=USER_AGENT_HEADERS,
        timeout=10,
    )
    r.raise_for_status()
    return r.json()


def _overpass_query(q: str):
    try:
        r = requests.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": q},
            headers=USER_AGENT_HEADERS,
            timeout=25,
        )
        r.raise_for_status()
        return r.json()
    except Exception:
        return {"elements": []}


@lru_cache(maxsize=128)
def overpass_pharmacies_near_city(city: str, radius_m: int = 6000, limit: int = 20):
    """Fallback: query OSM Overpass for pharmacies near a city center.
    Returns list of dicts with lat, lon, name.
    """
    coords = geocode(city)
    if not coords:
        return []
    lat, lon = coords
    q = f"""
    [out:json][timeout:25];
    node["amenity"="pharmacy"](around:{radius_m},{lat},{lon});
    way["amenity"="pharmacy"](around:{radius_m},{lat},{lon});
    rel["amenity"="pharmacy"](around:{radius_m},{lat},{lon});
    out center {limit};
    """
    js = _overpass_query(q)
    elements = js.get("elements", [])
    results = []
    for el in elements:
        typ = el.get("type")
        name = (el.get("tags", {}) or {}).get("name")
        if typ == "node":
            results.append({
                "name": name or "Pharmacy",
                "lat": el.get("lat"),
                "lon": el.get("lon"),
                "source": "overpass"
            })
        else:
            center = el.get("center") or {}
            if center.get("lat") and center.get("lon"):
                results.append({
                    "name": name or "Pharmacy",
                    "lat": center.get("lat"),
                    "lon": center.get("lon"),
                    "source": "overpass"
                })
        if len(results) >= limit:
            break
    return results
