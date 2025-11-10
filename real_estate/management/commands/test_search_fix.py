"""
Test the Turkish character fix for real estate search.

Usage:
    docker compose exec web python manage.py test_search_fix
"""
from django.core.management.base import BaseCommand
from django.db.models import Q
from real_estate.models import Listing
from real_estate.views import get_city_search_variants


class Command(BaseCommand):
    help = "Test Turkish character fix for real estate search"

    def handle(self, *args, **options):
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("TESTING TURKISH CHARACTER FIX"))
        self.stdout.write("=" * 80)

        # Test cases: search with ASCII, should match Turkish DB entries
        test_cases = [
            {"city": "Iskele", "rent_type": "long_term"},
            {"city": "İskele", "rent_type": "long_term"},  # Turkish input
            {"city": "Lefkosa", "rent_type": "long_term"},
            {"city": "Lefkoşa", "rent_type": "long_term"},  # Turkish input
            {"city": "Girne", "rent_type": "long_term"},
            {"city": "Gazimagusa", "rent_type": "long_term"},
            {"city": "Gazimağusa", "rent_type": "long_term"},  # Turkish input
        ]

        for test in test_cases:
            city = test["city"]
            rent_type = test["rent_type"]

            self.stdout.write(f"\n🧪 Testing: city='{city}', rent_type='{rent_type}'")

            # Show variants that will be searched
            variants = get_city_search_variants(city)
            self.stdout.write(f"   City variants to search: {variants}")

            # Replicate the EXACT query from views.py (after the fix)
            qs = Listing.objects.all()

            # Apply city filter with variants (like the fixed view does)
            city_variants = get_city_search_variants(city)
            if len(city_variants) == 1:
                qs = qs.filter(city__iexact=city_variants[0])
            else:
                city_q = Q()
                for variant in city_variants:
                    city_q |= Q(city__iexact=variant)
                qs = qs.filter(city_q)

            # Apply rent_type filter
            qs = qs.filter(Q(rent_type=rent_type) | Q(rent_type='both'))

            result_count = qs.count()

            if result_count > 0:
                self.stdout.write(self.style.SUCCESS(f"   ✅ Found {result_count} listings"))

                # Show sample
                sample = qs.first()
                if sample:
                    self.stdout.write(f"      Sample: {sample.title}")
                    self.stdout.write(f"      DB city: '{sample.city}', rent_type: {sample.rent_type}")
            else:
                self.stdout.write(self.style.ERROR(f"   ❌ No results found"))

        # Summary
        self.stdout.write(f"\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("TEST COMPLETE"))
        self.stdout.write(f"\nExpected results:")
        self.stdout.write(f"  - All test cases should return > 0 listings")
        self.stdout.write(f"  - Both 'Iskele' and 'İskele' should find same listings")
        self.stdout.write(f"  - Both 'Lefkosa' and 'Lefkoşa' should find same listings")
        self.stdout.write("=" * 80)
