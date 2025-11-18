"""
Management command to populate demo real estate listings with realistic data.

Usage:
    python manage.py populate_demo_listings
    python manage.py populate_demo_listings --clear  # Clear existing demos first
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from real_estate.models import (
    Location, PropertyType, FeatureCategory, Feature,
    Property, Listing, ListingType, RentalDetails,
    PropertyFeature
)


class Command(BaseCommand):
    help = "Populate demo real estate listings with realistic data"

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing demo listings before populating',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing demo listings...')
            # Only clear listings we know are demos (reference codes starting with DEMO-)
            Listing.objects.filter(reference_code__startswith='DEMO-').delete()
            Property.objects.filter(reference_code__startswith='DEMO-').delete()
            self.stdout.write(self.style.SUCCESS('Cleared demo listings'))

        self.stdout.write('Populating demo listings...')

        with transaction.atomic():
            # Get or create locations
            kyrenia_center, _ = Location.objects.get_or_create(
                country="Cyprus",
                region="North Cyprus",
                city="Kyrenia",
                area="City Center"
            )

            catalkoy, _ = Location.objects.get_or_create(
                country="Cyprus",
                region="North Cyprus",
                city="Kyrenia",
                area="Catalkoy"
            )

            esentepe, _ = Location.objects.get_or_create(
                country="Cyprus",
                region="North Cyprus",
                city="Kyrenia",
                area="Esentepe"
            )

            alsancak, _ = Location.objects.get_or_create(
                country="Cyprus",
                region="North Cyprus",
                city="Kyrenia",
                area="Alsancak"
            )

            # Get property types
            apartment_type, _ = PropertyType.objects.get_or_create(
                code="APARTMENT",
                defaults={"label": "Apartment", "category": "RESIDENTIAL"}
            )

            villa_type, _ = PropertyType.objects.get_or_create(
                code="VILLA",
                defaults={"label": "Villa", "category": "RESIDENTIAL"}
            )

            penthouse_type, _ = PropertyType.objects.get_or_create(
                code="PENTHOUSE",
                defaults={"label": "Penthouse", "category": "RESIDENTIAL"}
            )

            # Get listing types
            daily_rental, _ = ListingType.objects.get_or_create(
                code="DAILY_RENTAL",
                defaults={"label": "Daily Rental"}
            )

            long_term_rental, _ = ListingType.objects.get_or_create(
                code="LONG_TERM_RENTAL",
                defaults={"label": "Long-Term Rental"}
            )

            sale, _ = ListingType.objects.get_or_create(
                code="SALE",
                defaults={"label": "For Sale"}
            )

            # Get features
            wifi, _ = Feature.objects.get_or_create(
                code="WIFI",
                defaults={"label": "WiFi", "category": FeatureCategory.objects.first() or None}
            )

            kitchen, _ = Feature.objects.get_or_create(
                code="KITCHEN",
                defaults={"label": "Kitchen", "category": FeatureCategory.objects.first() or None}
            )

            pool, _ = Feature.objects.get_or_create(
                code="PRIVATE_POOL",
                defaults={"label": "Private Pool", "category": FeatureCategory.objects.first() or None}
            )

            shared_pool, _ = Feature.objects.get_or_create(
                code="SHARED_POOL",
                defaults={"label": "Shared Pool", "category": FeatureCategory.objects.first() or None}
            )

            parking, _ = Feature.objects.get_or_create(
                code="PARKING",
                defaults={"label": "Parking", "category": FeatureCategory.objects.first() or None}
            )

            ac, _ = Feature.objects.get_or_create(
                code="AC",
                defaults={"label": "Air Conditioning", "category": FeatureCategory.objects.first() or None}
            )

            sea_view, _ = Feature.objects.get_or_create(
                code="SEA_VIEW",
                defaults={"label": "Sea View", "category": FeatureCategory.objects.first() or None}
            )

            balcony, _ = Feature.objects.get_or_create(
                code="BALCONY",
                defaults={"label": "Balcony", "category": FeatureCategory.objects.first() or None}
            )

            # Create demo listings
            demo_listings = [
                # Long-term rental in Catalkoy
                {
                    "property": {
                        "reference_code": "DEMO-P-001",
                        "title": "Modern 2BR Apartment in Catalkoy",
                        "description": "Beautiful 2-bedroom apartment in the heart of Catalkoy. Close to amenities, beaches, and restaurants. Perfect for families or professionals.",
                        "location": catalkoy,
                        "property_type": apartment_type,
                        "bedrooms": 2,
                        "living_rooms": 1,
                        "bathrooms": 1,
                        "room_configuration_label": "2+1",
                        "total_area_sqm": Decimal("95.00"),
                        "furnished_status": "FULLY_FURNISHED",
                        "features": [wifi, kitchen, shared_pool, parking, ac, balcony]
                    },
                    "listing": {
                        "reference_code": "DEMO-L-001",
                        "listing_type": long_term_rental,
                        "title": "Long-term: Modern 2BR Apartment",
                        "description": "Beautiful 2-bedroom apartment perfect for long-term stay",
                        "base_price": Decimal("750.00"),
                        "currency": "GBP",
                        "price_period": "PER_MONTH",
                        "status": "ACTIVE"
                    },
                    "rental_details": {
                        "rental_kind": "LONG_TERM",
                        "min_months": 6,
                        "deposit_amount": Decimal("1500.00"),
                        "deposit_currency": "GBP"
                    }
                },
                # Daily rental villa in Esentepe
                {
                    "property": {
                        "reference_code": "DEMO-P-002",
                        "title": "Luxury 3BR Villa with Private Pool",
                        "description": "Stunning 3-bedroom villa with private pool and sea views. Located in peaceful Esentepe, perfect for a relaxing holiday.",
                        "location": esentepe,
                        "property_type": villa_type,
                        "bedrooms": 3,
                        "living_rooms": 1,
                        "bathrooms": 2,
                        "room_configuration_label": "3+1",
                        "total_area_sqm": Decimal("180.00"),
                        "furnished_status": "FULLY_FURNISHED",
                        "features": [wifi, kitchen, pool, parking, ac, sea_view, balcony]
                    },
                    "listing": {
                        "reference_code": "DEMO-L-002",
                        "listing_type": daily_rental,
                        "title": "Daily Rental: Luxury Villa with Pool",
                        "description": "Luxury villa perfect for your dream vacation",
                        "base_price": Decimal("250.00"),
                        "currency": "EUR",
                        "price_period": "PER_NIGHT",
                        "status": "ACTIVE"
                    },
                    "rental_details": {
                        "rental_kind": "DAILY",
                        "min_days": 3,
                        "deposit_amount": Decimal("500.00"),
                        "deposit_currency": "EUR"
                    }
                },
                # Long-term rental in Alsancak
                {
                    "property": {
                        "reference_code": "DEMO-P-003",
                        "title": "Cozy 1BR Apartment in Alsancak",
                        "description": "Perfect starter apartment in Alsancak. Close to supermarkets, cafes, and the beach. Ideal for singles or couples.",
                        "location": alsancak,
                        "property_type": apartment_type,
                        "bedrooms": 1,
                        "living_rooms": 1,
                        "bathrooms": 1,
                        "room_configuration_label": "1+1",
                        "total_area_sqm": Decimal("65.00"),
                        "furnished_status": "PARTLY_FURNISHED",
                        "features": [wifi, kitchen, shared_pool, ac]
                    },
                    "listing": {
                        "reference_code": "DEMO-L-003",
                        "listing_type": long_term_rental,
                        "title": "Long-term: Cozy 1BR in Alsancak",
                        "description": "Perfect apartment for singles or couples",
                        "base_price": Decimal("550.00"),
                        "currency": "GBP",
                        "price_period": "PER_MONTH",
                        "status": "ACTIVE"
                    },
                    "rental_details": {
                        "rental_kind": "LONG_TERM",
                        "min_months": 12,
                        "deposit_amount": Decimal("1100.00"),
                        "deposit_currency": "GBP"
                    }
                },
                # Penthouse for sale
                {
                    "property": {
                        "reference_code": "DEMO-P-004",
                        "title": "Luxury 3BR Penthouse with Sea Views",
                        "description": "Exclusive penthouse in Kyrenia city center with breathtaking sea views. Premium finishes and modern amenities throughout.",
                        "location": kyrenia_center,
                        "property_type": penthouse_type,
                        "bedrooms": 3,
                        "living_rooms": 1,
                        "bathrooms": 3,
                        "room_configuration_label": "3+1",
                        "total_area_sqm": Decimal("200.00"),
                        "furnished_status": "FULLY_FURNISHED",
                        "features": [wifi, kitchen, shared_pool, parking, ac, sea_view, balcony]
                    },
                    "listing": {
                        "reference_code": "DEMO-L-004",
                        "listing_type": sale,
                        "title": "For Sale: Luxury Penthouse",
                        "description": "Exclusive penthouse with stunning sea views",
                        "base_price": Decimal("450000.00"),
                        "currency": "GBP",
                        "price_period": "TOTAL",
                        "status": "ACTIVE"
                    }
                },
                # Daily rental apartment
                {
                    "property": {
                        "reference_code": "DEMO-P-005",
                        "title": "Beach-front 2BR Apartment",
                        "description": "Beautiful beach-front apartment with direct sea access. Wake up to stunning sunrise views every morning.",
                        "location": alsancak,
                        "property_type": apartment_type,
                        "bedrooms": 2,
                        "living_rooms": 1,
                        "bathrooms": 2,
                        "room_configuration_label": "2+1",
                        "total_area_sqm": Decimal("110.00"),
                        "furnished_status": "FULLY_FURNISHED",
                        "features": [wifi, kitchen, shared_pool, parking, ac, sea_view, balcony]
                    },
                    "listing": {
                        "reference_code": "DEMO-L-005",
                        "listing_type": daily_rental,
                        "title": "Daily Rental: Beach-front Apartment",
                        "description": "Beautiful beach-front apartment for your perfect vacation",
                        "base_price": Decimal("150.00"),
                        "currency": "EUR",
                        "price_period": "PER_NIGHT",
                        "status": "ACTIVE"
                    },
                    "rental_details": {
                        "rental_kind": "DAILY",
                        "min_days": 2,
                        "deposit_amount": Decimal("300.00"),
                        "deposit_currency": "EUR"
                    }
                },
                # Long-term in Catalkoy with sea view
                {
                    "property": {
                        "reference_code": "DEMO-P-006",
                        "title": "Spacious 3BR Apartment with Sea View",
                        "description": "Spacious 3-bedroom apartment in Catalkoy with stunning sea views. Large balcony perfect for entertaining.",
                        "location": catalkoy,
                        "property_type": apartment_type,
                        "bedrooms": 3,
                        "living_rooms": 1,
                        "bathrooms": 2,
                        "room_configuration_label": "3+1",
                        "total_area_sqm": Decimal("140.00"),
                        "furnished_status": "FULLY_FURNISHED",
                        "features": [wifi, kitchen, shared_pool, parking, ac, sea_view, balcony]
                    },
                    "listing": {
                        "reference_code": "DEMO-L-006",
                        "listing_type": long_term_rental,
                        "title": "Long-term: 3BR with Sea View",
                        "description": "Spacious apartment with stunning sea views",
                        "base_price": Decimal("950.00"),
                        "currency": "GBP",
                        "price_period": "PER_MONTH",
                        "status": "ACTIVE"
                    },
                    "rental_details": {
                        "rental_kind": "LONG_TERM",
                        "min_months": 6,
                        "deposit_amount": Decimal("1900.00"),
                        "deposit_currency": "GBP"
                    }
                },
            ]

            created_count = 0
            for demo in demo_listings:
                # Create property
                property_data = demo["property"]
                features_list = property_data.pop("features", [])

                property_obj = Property.objects.create(**property_data)

                # Add features
                for feature in features_list:
                    PropertyFeature.objects.create(
                        property=property_obj,
                        feature=feature
                    )

                # Create listing
                listing_data = demo["listing"]
                listing_obj = Listing.objects.create(
                    property=property_obj,
                    **listing_data
                )

                # Create rental details if applicable
                if "rental_details" in demo:
                    RentalDetails.objects.create(
                        listing=listing_obj,
                        **demo["rental_details"]
                    )

                created_count += 1
                self.stdout.write(f'Created: {listing_obj.reference_code} - {listing_obj.title}')

            self.stdout.write(
                self.style.SUCCESS(f'Successfully created {created_count} demo listings')
            )
