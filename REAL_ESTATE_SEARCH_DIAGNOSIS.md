# Real Estate Search Returning 0 Results - Diagnosis

**Date:** 2025-11-10
**Severity:** P1 - Data & Character Encoding Issue
**Status:** Root Cause Identified

---

## Issue Summary

Real estate search API is returning 0 results even though the backend is responding with 200 OK.

**From Logs:**
```
[RE Search] API returned 0 results in 22.9ms (params={'city': 'Iskele', 'rent_type': 'long_term', 'limit': 20})
[RE Search] Fallback: dropping rent_type and retrying (params={'city': 'Iskele', 'limit': 20})
```

Even the fallback search (without `rent_type` filter) returns 0 results.

---

## Root Cause Analysis

### Issue 1: No Data in Database (Most Likely)

**Evidence:**
- The search API is working correctly (200 OK response)
- The query parameters are correct (`city`, `rent_type`)
- Both primary search AND fallback return 0 results

**Diagnosis:**
The `real_estate_listing` table is likely **empty** or has very few listings.

**Verification:**
Run this command to check:
```bash
docker compose exec web python manage.py shell -c "from real_estate.models import Listing; print(f'Total listings: {Listing.objects.count()}')"
```

**Solution:**
Seed the database with sample listings:
```bash
docker compose exec web python manage.py seed_listings --count=120
```

This will create 120 realistic listings across 4 cities:
- Girne (Kyrenia)
- Lefkoşa (Nicosia)
- Gazimağusa (Famagusta)
- İskele (Iskele)

---

### Issue 2: Turkish Character Mismatch (Secondary)

**Evidence:**
From [real_estate/management/commands/seed_listings.py:44-51](real_estate/management/commands/seed_listings.py#L44-L51):

```python
"İskele": {
    "aliases": ["İskele", "Iskele", "Trikomo"],
    "districts": ["Boğaz", "Yeni Boğaziçi", "Bafra"],
    ...
},
```

The seed command creates listings with `city="İskele"` (Turkish **İ** character).

But the search is looking for `city="Iskele"` (English **I**).

**The Query:**
From [real_estate/views.py:54](real_estate/views.py#L54):
```python
if city:
    qs = qs.filter(city__iexact=city)
```

The `__iexact` lookup does case-insensitive matching, but it **does NOT normalize Turkish characters**.

**Result:**
- Database has: `city="İskele"`
- Search looking for: `city="Iskele"`
- Match result: **False** (even with `__iexact`)

**Why This Happens:**
The user agent extracts "Iskele" from the user message (without Turkish character), but the database stores "İskele" (with Turkish character).

---

## Solutions

### Solution 1: Normalize City Names in Database (Recommended)

Update the seed command to store city names **without Turkish characters** for consistency with search:

**File:** [real_estate/management/commands/seed_listings.py:44](real_estate/management/commands/seed_listings.py#L44)

```python
# BEFORE
"İskele": {
    "aliases": ["İskele", "Iskele", "Trikomo"],
    ...
},

# AFTER
"Iskele": {  # Store without Turkish character
    "aliases": ["İskele", "Iskele", "Trikomo"],
    ...
},
```

Then re-seed the database:
```bash
docker compose exec web python manage.py seed_listings --flush=true --count=120
```

### Solution 2: Add Turkish Character Normalization to Search API

Add a helper function to normalize Turkish characters before querying:

**File:** [real_estate/views.py:52-54](real_estate/views.py#L52-L54)

```python
def normalize_turkish(text: str) -> str:
    """Normalize Turkish characters to ASCII equivalents."""
    replacements = {
        'İ': 'I', 'ı': 'i', 'Ş': 'S', 'ş': 's',
        'Ğ': 'G', 'ğ': 'g', 'Ü': 'U', 'ü': 'u',
        'Ö': 'O', 'ö': 'o', 'Ç': 'C', 'ç': 'c'
    }
    for tr, en in replacements.items():
        text = text.replace(tr, en)
    return text

# Filter by city (normalize Turkish characters)
if city:
    # Try exact match first
    qs_exact = qs.filter(city__iexact=city)
    if qs_exact.exists():
        qs = qs_exact
    else:
        # Try normalized match
        normalized = normalize_turkish(city)
        qs = qs.filter(city__iexact=normalized)
```

### Solution 3: Use Aliases for City Matching (Best Long-Term)

Create a city alias mapping that handles multiple spellings:

**File:** [real_estate/views.py](real_estate/views.py)

```python
CITY_ALIASES = {
    "iskele": ["İskele", "Iskele", "Trikomo"],
    "girne": ["Girne", "Kyrenia"],
    "lefkosa": ["Lefkoşa", "Lefkosa", "Nicosia"],
    "gazimagusa": ["Gazimağusa", "Famagusta", "Mağusa"],
}

def resolve_city_name(input_city: str) -> list:
    """Resolve city input to all known aliases."""
    normalized = input_city.lower()

    # Check if it's a known alias key
    if normalized in CITY_ALIASES:
        return CITY_ALIASES[normalized]

    # Check if it matches any alias
    for key, aliases in CITY_ALIASES.items():
        if input_city in aliases or normalized in [a.lower() for a in aliases]:
            return aliases

    # Return original if no match
    return [input_city]

# Filter by city (use aliases)
if city:
    possible_cities = resolve_city_name(city)
    qs = qs.filter(city__in=possible_cities)
```

---

## Immediate Action Plan

### Step 1: Verify Database is Empty
```bash
# Check listing count
docker compose exec web python manage.py shell -c "
from real_estate.models import Listing
print(f'Total listings: {Listing.objects.count()}')
print(f'Listings in İskele: {Listing.objects.filter(city__icontains=\"skele\").count()}')
print(f'Cities in DB: {list(Listing.objects.values_list(\"city\", flat=True).distinct())}')
"
```

**Expected Output (if empty):**
```
Total listings: 0
Listings in İskele: 0
Cities in DB: []
```

### Step 2: Seed the Database
```bash
# Seed 120 listings across 4 cities
docker compose exec web python manage.py seed_listings --count=120

# Verify seeding
docker compose exec web python manage.py shell -c "
from real_estate.models import Listing
print(f'Total listings: {Listing.objects.count()}')
print(f'Long-term: {Listing.objects.filter(rent_type=\"long_term\").count()}')
print(f'Short-term: {Listing.objects.filter(rent_type=\"short_term\").count()}')
print(f'Both: {Listing.objects.filter(rent_type=\"both\").count()}')
"
```

**Expected Output:**
```
✓ Seeded 120 new listings, X short-term blocks
Total listings in DB: 120
  - Long-term: 60
  - Short-term: 60
  - Both: 0
```

### Step 3: Test Search with Correct City Name
```bash
# Test with Turkish character (how it's stored)
curl "http://localhost:8000/api/v1/real_estate/search?city=İskele&rent_type=long_term&limit=5"

# Test with English character (how the agent searches)
curl "http://localhost:8000/api/v1/real_estate/search?city=Iskele&rent_type=long_term&limit=5"

# Test other cities
curl "http://localhost:8000/api/v1/real_estate/search?city=Girne&rent_type=long_term&limit=5"
```

### Step 4: Apply Character Normalization Fix (If Needed)

If Step 3 shows that "İskele" works but "Iskele" doesn't, apply Solution 1 (normalize city names in database):

```bash
# Update seed command to use "Iskele" instead of "İskele"
# Then re-seed
docker compose exec web python manage.py seed_listings --flush=true --count=120
```

---

## Verification Checklist

After seeding the database:

- [ ] Total listing count is > 0
- [ ] Listings exist for İskele/Iskele
- [ ] Search with `city=Iskele&rent_type=long_term` returns results
- [ ] Search with `city=Girne&rent_type=long_term` returns results
- [ ] Search without `rent_type` returns results
- [ ] Agent can retrieve recommendations

---

## Expected Logs After Fix

**Before Seeding:**
```
[RE Search] API returned 0 results in 22.9ms (params={'city': 'Iskele', 'rent_type': 'long_term', 'limit': 20})
[RE Search] Fallback: dropping rent_type and retrying (params={'city': 'Iskele', 'limit': 20})
```

**After Seeding:**
```
[RE Search] API returned 15 results in 18.5ms (params={'city': 'Iskele', 'rent_type': 'long_term', 'limit': 20})
```

---

## Files to Check/Modify

1. **Database Seeding:**
   - [real_estate/management/commands/seed_listings.py:44](real_estate/management/commands/seed_listings.py#L44) - City name definition

2. **Search API:**
   - [real_estate/views.py:54](real_estate/views.py#L54) - City filtering logic

3. **Search Adapter:**
   - [assistant/domain/real_estate_search.py:84](assistant/domain/real_estate_search.py#L84) - Slot mapping (already correct)

---

## Summary

**Primary Issue:** Database likely has **no listings** (needs seeding)

**Secondary Issue:** Turkish character mismatch (İskele vs Iskele)

**Quick Fix:** Run `python manage.py seed_listings --count=120`

**Long-Term Fix:** Normalize city names to ASCII (without Turkish characters) for consistency

---

**Next Steps:**
1. Run seed command to populate database
2. Test search API with various cities
3. If Turkish character issue persists, apply normalization fix
4. Verify agent can retrieve recommendations

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Awaiting database seeding
