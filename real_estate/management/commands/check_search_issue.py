"""
Django management command to diagnose real estate search returning 0 results.

Usage:
    docker compose exec web python manage.py check_search_issue
"""
from django.core.management.base import BaseCommand
from django.db.models import Q
from real_estate.models import Listing


class Command(BaseCommand):
    help = "Diagnose why real estate search is returning 0 results"

    def handle(self, *args, **options):
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("REAL ESTATE SEARCH DIAGNOSTIC"))
        self.stdout.write("=" * 80)

        # Check total listings
        total = Listing.objects.count()
        self.stdout.write(f"\n📊 Total listings in database: {total}")

        if total == 0:
            self.stdout.write(self.style.ERROR("\n❌ DATABASE IS EMPTY!"))
            self.stdout.write("   Run: python manage.py seed_listings --count=120")
            return

        # Breakdown by rent_type
        long_term = Listing.objects.filter(rent_type='long_term').count()
        short_term = Listing.objects.filter(rent_type='short_term').count()
        both = Listing.objects.filter(rent_type='both').count()

        self.stdout.write(f"\n📋 Breakdown by rent_type:")
        self.stdout.write(f"   - long_term: {long_term}")
        self.stdout.write(f"   - short_term: {short_term}")
        self.stdout.write(f"   - both: {both}")

        # Get all unique cities
        cities = list(Listing.objects.values_list('city', flat=True).distinct().order_by('city'))
        self.stdout.write(f"\n🏙️  Cities in database ({len(cities)} unique):")
        for city in cities:
            count = Listing.objects.filter(city=city).count()
            self.stdout.write(f"   - {repr(city)}: {count} listings")

        # Check for Turkish character variations
        self.stdout.write(f"\n🔍 Checking for 'Iskele' variations:")

        iskele_ascii = Listing.objects.filter(city__iexact='Iskele').count()
        iskele_turkish = Listing.objects.filter(city__iexact='İskele').count()
        iskele_contains = Listing.objects.filter(city__icontains='skele').count()

        self.stdout.write(f"   - city__iexact='Iskele' (ASCII): {iskele_ascii}")
        self.stdout.write(f"   - city__iexact='İskele' (Turkish): {iskele_turkish}")
        self.stdout.write(f"   - city__icontains='skele': {iskele_contains}")

        # Now test the EXACT query from logs
        self.stdout.write(f"\n🧪 Testing exact query from logs:")
        self.stdout.write(f"   Query: city='Iskele', rent_type='long_term'")

        # Replicate the exact filtering from views.py
        qs = Listing.objects.all()

        # Step 1: Filter by city (case-insensitive)
        city = 'Iskele'
        qs = qs.filter(city__iexact=city)
        self.stdout.write(f"   After city filter: {qs.count()} listings")

        # Step 2: Filter by rent_type
        rent_type = 'long_term'
        qs = qs.filter(Q(rent_type=rent_type) | Q(rent_type='both'))
        result_count = qs.count()
        self.stdout.write(f"   After rent_type filter: {result_count} listings")

        if result_count == 0:
            self.stdout.write(self.style.ERROR("\n❌ QUERY RETURNED 0 RESULTS!"))
            self.stdout.write("\n🔧 Diagnosing issue...")

            # Check if ANY long_term listings exist
            all_lt = Listing.objects.filter(Q(rent_type='long_term') | Q(rent_type='both')).count()
            self.stdout.write(f"   1. Total long_term/both in DB: {all_lt}")

            # Check if Iskele exists with different character
            if iskele_contains > 0 and iskele_ascii == 0:
                sample = Listing.objects.filter(city__icontains='skele').first()
                if sample:
                    self.stdout.write(self.style.WARNING(f"\n   2. ⚠️  TURKISH CHARACTER MISMATCH DETECTED!"))
                    self.stdout.write(f"      - Database has: '{sample.city}' (with Turkish İ)")
                    self.stdout.write(f"      - Search looking for: 'Iskele' (with ASCII I)")
                    self.stdout.write(f"      - Django's __iexact does NOT normalize Turkish characters")
                    self.stdout.write(f"\n   💡 Solution: Normalize city names in seed data to ASCII")
                    self.stdout.write(f"      File: real_estate/management/commands/seed_listings.py:44")
                    self.stdout.write(f"      Change: 'İskele' → 'Iskele'")

            # Check rent_type breakdown for Iskele
            iskele_all = Listing.objects.filter(city__icontains='skele')
            if iskele_all.count() > 0:
                iskele_st = iskele_all.filter(rent_type='short_term').count()
                iskele_lt = iskele_all.filter(Q(rent_type='long_term') | Q(rent_type='both')).count()

                self.stdout.write(f"\n   3. Rent type breakdown for Iskele (all spellings):")
                self.stdout.write(f"      - short_term: {iskele_st}")
                self.stdout.write(f"      - long_term/both: {iskele_lt}")

                if iskele_lt == 0:
                    self.stdout.write(self.style.WARNING(f"      ⚠️  All Iskele listings are short_term!"))
                    self.stdout.write(f"      Need to seed long_term listings for Iskele")

        else:
            self.stdout.write(self.style.SUCCESS(f"\n✅ QUERY WORKS! Found {result_count} listings"))
            self.stdout.write(f"\n📋 Sample results:")
            for listing in qs[:3]:
                self.stdout.write(f"   - {listing.title}")
                self.stdout.write(f"     city={repr(listing.city)}, rent_type={listing.rent_type}, "
                                f"monthly_price={listing.monthly_price}")

        # Test with other cities to verify API works
        self.stdout.write(f"\n🧪 Testing with other cities:")
        for test_city in ['Girne', 'Lefkoşa', 'Gazimağusa']:
            test_qs = Listing.objects.filter(city__iexact=test_city)
            test_qs = test_qs.filter(Q(rent_type='long_term') | Q(rent_type='both'))
            count = test_qs.count()
            if count > 0:
                self.stdout.write(f"   - {test_city}: {count} long_term listings ✅")
            else:
                self.stdout.write(f"   - {test_city}: 0 listings")

        self.stdout.write("\n" + "=" * 80)
