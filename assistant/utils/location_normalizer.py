"""
Location Name Normalizer

Handles city/area name variations (Turkish/English/Greek) for North Cyprus.
"""

from typing import Optional


# City name aliases (Turkish <-> English <-> Greek)
CITY_ALIASES = {
    # Kyrenia / Girne
    "girne": "Kyrenia",
    "kyrenia": "Kyrenia",
    "keryneia": "Kyrenia",

    # Famagusta / Gazima ğusa
    "gazimagusa": "Famagusta",
    "famagusta": "Famagusta",
    "ammochostos": "Famagusta",
    "magusa": "Famagusta",

    # Nicosia / Lefkoşa
    "lefkosa": "Nicosia",
    "nicosia": "Nicosia",
    "lefkosia": "Nicosia",

    # Morphou / Güzelyurt
    "guzelyurt": "Morphou",
    "morphou": "Morphou",
    "morfou": "Morphou",

    # Lefke / Lefka
    "lefke": "Lefke",
    "lefka": "Lefke",

    # Other common areas
    "catalkoy": "Catalkoy",
    "çatalköy": "Catalkoy",
    "esentepe": "Esentepe",
    "alsancak": "Alsancak",
    "karaoglanoglu": "Karaoglanoglu",
    "karaoğlanoğlu": "Karaoglanoglu",
    "lapta": "Lapta",
    "karaman": "Karaman",
    "edremit": "Edremit",
    "ozankoy": "Ozankoy",
    "ozanköy": "Ozankoy",
}


def normalize_city_name(city: str) -> str:
    """
    Normalize a city name to its canonical form.

    Args:
        city: City name in any variant (Turkish/English/Greek)

    Returns:
        Normalized city name (English form)

    Examples:
        >>> normalize_city_name("Girne")
        "Kyrenia"
        >>> normalize_city_name("kyrenia")
        "Kyrenia"
        >>> normalize_city_name("Lefkoşa")
        "Nicosia"
    """
    if not city:
        return city

    # Normalize to lowercase for lookup
    city_lower = city.strip().lower()

    # Remove common Turkish characters for fuzzy matching
    city_normalized = (
        city_lower
        .replace("ş", "s")
        .replace("ğ", "g")
        .replace("ı", "i")
        .replace("ö", "o")
        .replace("ü", "u")
        .replace("ç", "c")
    )

    # Try exact match first
    if city_lower in CITY_ALIASES:
        return CITY_ALIASES[city_lower]

    # Try normalized match
    if city_normalized in CITY_ALIASES:
        return CITY_ALIASES[city_normalized]

    # Return original with proper capitalization if no match
    return city.strip().title()


def get_city_aliases(canonical_city: str) -> list:
    """
    Get all known aliases for a canonical city name.

    Args:
        canonical_city: The canonical English city name

    Returns:
        List of all known aliases (including the canonical name)

    Examples:
        >>> get_city_aliases("Kyrenia")
        ["Kyrenia", "Girne", "Keryneia"]
    """
    aliases = [canonical_city]
    canonical_lower = canonical_city.lower()

    for alias, canonical in CITY_ALIASES.items():
        if canonical.lower() == canonical_lower:
            aliases.append(alias.title())

    return list(set(aliases))
