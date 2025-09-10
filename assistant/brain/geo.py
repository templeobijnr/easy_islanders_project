from typing import Dict, List, Optional


ALIASES: Dict[str, List[str]] = {
    "kyrenia": ["kyrenia", "girne"],
    "nicosia": ["nicosia", "lefkoşa", "lefkosa", "lefkoşa"],
    "famagusta": ["famagusta", "magusa", "mağusa"],
    "iskele": ["iskele"],
    "catalkoy": ["çatalköy", "catalkoy", "çatalkoy", "catalköy"],
    "karakum": ["karakum", "kara kum"],
    "lapta": ["lapta"],
    "alsancak": ["alsancak"],
    "bellapais": ["bellapais"],
    "esentepe": ["esentepe", "asentepe"],
}


REGIONAL_MAP: Dict[str, str] = {
    "catalkoy": "kyrenia",
    "karakum": "kyrenia",
    "lapta": "kyrenia",
    "alsancak": "kyrenia",
    "bellapais": "kyrenia",
    "esentepe": "kyrenia",
}


def normalize_location(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    t = (raw or "").lower().strip()
    # Exact alias hit
    for canon, names in ALIASES.items():
        if t in names:
            return canon
    # Partial contains
    for canon, names in ALIASES.items():
        if any(n in t for n in names):
            return canon
    return raw


def regional_fallback(canon: Optional[str]) -> Optional[str]:
    if not canon:
        return None
    return REGIONAL_MAP.get(canon)


