"""
Django management command to seed real estate listings with tenure support.

Usage:
    python3 manage.py seed_listings
    python3 manage.py seed_listings --clear  # Clear existing first
"""
from django.core.management.base import BaseCommand
from datetime import date, timedelta
from real_estate.models import Listing, Availability


class Command(BaseCommand):
    help = "Seed real estate listings with short-term and long-term fixtures"

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing listings before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing listings...')
            Listing.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared all listings'))

        self.stdout.write('Seeding listings...')

        # Short-term listings (nightly rentals)
        short_term_listings = [
            {
                'external_id': 'st-kyr-001',
                'title': 'Modern 2BR Apartment Near Sea',
                'description': 'Beautiful modern apartment with sea views, 5 min walk to beach. Fully equipped kitchen, WiFi, A/C.',
                'tenure': 'short_term',
                'price_amount': 120,
                'price_unit': 'per_night',
                'currency': 'GBP',
                'bedrooms': 2,
                'bathrooms': 1,
                'max_guests': 4,
                'property_type': 'apartment',
                'square_meters': 75,
                'amenities': ['wifi', 'ac', 'kitchen', 'parking', 'balcony'],
                'city': 'Kyrenia',
                'area': 'Alsancak',
                'address': 'Alsancak Beach Road',
                'min_stay_nights': 3,
                'image_url': 'https://example.com/listings/st-kyr-001.jpg',
                'is_active': True,
            },
            {
                'external_id': 'st-fam-001',
                'title': 'Luxury 3BR Villa with Pool',
                'description': 'Stunning villa with private pool, garden, and mountain views. Perfect for families.',
                'tenure': 'short_term',
                'price_amount': 250,
                'price_unit': 'per_night',
                'currency': 'GBP',
                'bedrooms': 3,
                'bathrooms': 2,
                'max_guests': 6,
                'property_type': 'villa',
                'square_meters': 150,
                'amenities': ['wifi', 'ac', 'kitchen', 'pool', 'garden', 'parking', 'bbq'],
                'city': 'Famagusta',
                'area': 'Salamis',
                'address': 'Salamis Bay',
                'min_stay_nights': 7,
                'image_url': 'https://example.com/listings/st-fam-001.jpg',
                'is_active': True,
            },
            {
                'external_id': 'st-nic-001',
                'title': 'Cozy Studio in City Center',
                'description': 'Charming studio in historic Nicosia. Walking distance to shops, restaurants, and Old Town.',
                'tenure': 'short_term',
                'price_amount': 60,
                'price_unit': 'per_night',
                'currency': 'GBP',
                'bedrooms': 1,
                'bathrooms': 1,
                'max_guests': 2,
                'property_type': 'studio',
                'square_meters': 35,
                'amenities': ['wifi', 'ac', 'kitchen'],
                'city': 'Nicosia',
                'area': 'Old Town',
                'address': 'Ledra Street',
                'min_stay_nights': 2,
                'image_url': 'https://example.com/listings/st-nic-001.jpg',
                'is_active': True,
            },
        ]

        # Long-term listings (monthly rentals)
        long_term_listings = [
            {
                'external_id': 'lt-kyr-001',
                'title': '2BR Apartment for Long-Term Rent',
                'description': 'Spacious 2-bedroom apartment ideal for long-term stay. Includes all utilities.',
                'tenure': 'long_term',
                'price_amount': 800,
                'price_unit': 'per_month',
                'currency': 'GBP',
                'bedrooms': 2,
                'bathrooms': 1,
                'max_guests': 4,
                'property_type': 'apartment',
                'square_meters': 80,
                'amenities': ['wifi', 'ac', 'kitchen', 'parking', 'furnished'],
                'city': 'Kyrenia',
                'area': 'Karakum',
                'address': 'Karakum Main Street',
                'min_lease_months': 6,
                'available_from': date.today() + timedelta(days=14),
                'image_url': 'https://example.com/listings/lt-kyr-001.jpg',
                'is_active': True,
            },
            {
                'external_id': 'lt-fam-001',
                'title': '3BR Family Home - 12 Month Lease',
                'description': 'Comfortable family home with garden. Quiet neighborhood, close to schools.',
                'tenure': 'long_term',
                'price_amount': 1200,
                'price_unit': 'per_month',
                'currency': 'GBP',
                'bedrooms': 3,
                'bathrooms': 2,
                'max_guests': 6,
                'property_type': 'house',
                'square_meters': 120,
                'amenities': ['wifi', 'ac', 'kitchen', 'garden', 'parking', 'furnished'],
                'city': 'Famagusta',
                'area': 'Varosha',
                'address': 'Varosha Residential',
                'min_lease_months': 12,
                'available_from': date.today() + timedelta(days=30),
                'image_url': 'https://example.com/listings/lt-fam-001.jpg',
                'is_active': True,
            },
            {
                'external_id': 'lt-nic-001',
                'title': '1BR Central Flat - Available Now',
                'description': 'Modern 1-bedroom flat in central Nicosia. Perfect for professionals.',
                'tenure': 'long_term',
                'price_amount': 650,
                'price_unit': 'per_month',
                'currency': 'GBP',
                'bedrooms': 1,
                'bathrooms': 1,
                'max_guests': 2,
                'property_type': 'apartment',
                'square_meters': 50,
                'amenities': ['wifi', 'ac', 'kitchen', 'furnished'],
                'city': 'Nicosia',
                'area': 'City Center',
                'address': 'Makarios Avenue',
                'min_lease_months': 6,
                'available_from': date.today(),
                'image_url': 'https://example.com/listings/lt-nic-001.jpg',
                'is_active': True,
            },
        ]

        # Create short-term listings with availability calendar
        st_count = 0
        for data in short_term_listings:
            listing, created = Listing.objects.get_or_create(
                external_id=data['external_id'],
                defaults=data
            )
            if created:
                st_count += 1
                self.stdout.write(f'  Created: {listing.title}')

                # Add availability for next 90 days
                today = date.today()
                for i in range(90):
                    check_date = today + timedelta(days=i)
                    Availability.objects.get_or_create(
                        listing=listing,
                        date=check_date,
                        defaults={'is_available': True}
                    )
                self.stdout.write(f'    Added 90 days of availability')
            else:
                self.stdout.write(self.style.WARNING(f'  Skipped (exists): {listing.title}'))

        # Create long-term listings
        lt_count = 0
        for data in long_term_listings:
            listing, created = Listing.objects.get_or_create(
                external_id=data['external_id'],
                defaults=data
            )
            if created:
                lt_count += 1
                self.stdout.write(f'  Created: {listing.title}')
            else:
                self.stdout.write(self.style.WARNING(f'  Skipped (exists): {listing.title}'))

        self.stdout.write(self.style.SUCCESS(
            f'\nSeeding complete: {st_count} short-term, {lt_count} long-term listings created'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'Total listings in DB: {Listing.objects.count()}'
        ))
