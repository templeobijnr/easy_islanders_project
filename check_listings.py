#!/usr/bin/env python
"""
Quick diagnostic script to check real estate listings in the database.
Run with: docker compose exec web python check_listings.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')
django.setup()

from real_estate.models import Listing

print("=" * 80)
print("REAL ESTATE LISTINGS DATABASE CHECK")
print("=" * 80)

# Total count
total = Listing.objects.count()
print(f"\n📊 Total listings: {total}")

if total == 0:
    print("\n❌ Database is EMPTY - no listings found")
    print("   Run: python manage.py seed_listings --count=120")
    exit()

# Breakdown by rent_type
long_term = Listing.objects.filter(rent_type='long_term').count()
short_term = Listing.objects.filter(rent_type='short_term').count()
both = Listing.objects.filter(rent_type='both').count()

print(f"\n📋 Breakdown by rent_type:")
print(f"   - long_term: {long_term}")
print(f"   - short_term: {short_term}")
print(f"   - both: {both}")

# All unique cities
cities = list(Listing.objects.values_list('city', flat=True).distinct().order_by('city'))
print(f"\n🏙️  Cities in database ({len(cities)} unique):")
for city in cities:
    count = Listing.objects.filter(city=city).count()
    print(f"   - {city!r}: {count} listings")

# Check for "Iskele" vs "İskele"
print(f"\n🔍 Checking for Iskele variants:")
iskele_exact = Listing.objects.filter(city__iexact='Iskele').count()
iskele_turkish = Listing.objects.filter(city__iexact='İskele').count()
iskele_contains = Listing.objects.filter(city__icontains='skele').count()

print(f"   - city__iexact='Iskele' (English I): {iskele_exact}")
print(f"   - city__iexact='İskele' (Turkish İ): {iskele_turkish}")
print(f"   - city__icontains='skele': {iskele_contains}")

# Sample listings from each city
print(f"\n📝 Sample listings (first 3 per city):")
for city in cities[:4]:  # Limit to first 4 cities
    print(f"\n   {city}:")
    samples = Listing.objects.filter(city=city)[:3]
    for listing in samples:
        print(f"      - {listing.title}")
        print(f"        rent_type={listing.rent_type}, bedrooms={listing.bedrooms}, monthly_price={listing.monthly_price}")

# Test the exact query from the logs
print(f"\n🧪 Testing exact query from logs:")
print(f"   Query: city='Iskele', rent_type='long_term'")

from django.db.models import Q
test_qs = Listing.objects.all()
test_qs = test_qs.filter(city__iexact='Iskele')
test_qs = test_qs.filter(Q(rent_type='long_term') | Q(rent_type='both'))
test_count = test_qs.count()

print(f"   Results: {test_count} listings")

if test_count == 0:
    print(f"\n❌ Query returned 0 results!")
    print(f"\n🔧 Possible issues:")

    # Check if any long-term listings exist at all
    all_lt = Listing.objects.filter(Q(rent_type='long_term') | Q(rent_type='both')).count()
    print(f"   1. Total long_term/both listings in DB: {all_lt}")

    # Check if Iskele exists with different spelling
    if iskele_contains > 0 and iskele_exact == 0:
        actual_iskele = Listing.objects.filter(city__icontains='skele').first()
        if actual_iskele:
            print(f"   2. ❗ City name mismatch!")
            print(f"      - Searching for: 'Iskele' (English I)")
            print(f"      - Database has: '{actual_iskele.city}' (Turkish İ)")
            print(f"      - Solution: Normalize city names to ASCII")

    # Check if all Iskele listings are short_term
    iskele_all = Listing.objects.filter(city__icontains='skele')
    iskele_st = iskele_all.filter(rent_type='short_term').count()
    iskele_lt = iskele_all.filter(Q(rent_type='long_term') | Q(rent_type='both')).count()

    if iskele_all.count() > 0:
        print(f"   3. Rent type breakdown for Iskele variants:")
        print(f"      - short_term: {iskele_st}")
        print(f"      - long_term/both: {iskele_lt}")

        if iskele_lt == 0:
            print(f"      ❗ All Iskele listings are short_term!")
            print(f"      - Need to add long_term listings for Iskele")

else:
    print(f"\n✅ Query works! Found {test_count} matching listings")
    print(f"\n📋 Sample results:")
    for listing in test_qs[:3]:
        print(f"   - {listing.title}")
        print(f"     rent_type={listing.rent_type}, monthly_price={listing.monthly_price}")

print("\n" + "=" * 80)
