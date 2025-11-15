"""
Populate sample real estate listings for testing.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from real_estate.models import (
    Listing, Property, Location, ListingType, PropertyType,
    Contact, Client, Feature, PropertyFeature
)
from decimal import Decimal
import uuid


class Command(BaseCommand):
    help = "Populate sample real estate listings"

    def handle(self, *args, **options):
        # Get or create reference data
        daily_rental = ListingType.objects.get(code="DAILY_RENTAL")
        long_term_rental = ListingType.objects.get(code="LONG_TERM_RENTAL")
        sale = ListingType.objects.get(code="SALE")

        apartment = PropertyType.objects.get(code="APARTMENT")
        villa = PropertyType.objects.get(code="VILLA_DETACHED")

        # Get locations
        kyrenia = Location.objects.filter(city="Kyrenia").first()
        if not kyrenia:
            kyrenia = Location.objects.create(
                country="Cyprus", region="North Cyprus", city="Kyrenia", area="Esentepe"
            )

        nicosia = Location.objects.filter(city="Nicosia").first()
        if not nicosia:
            nicosia = Location.objects.create(
                country="Cyprus", region="North Cyprus", city="Nicosia", area="Gönyeli"
            )

        # Create sample properties
        prop1 = Property.objects.create(
            reference_code="EI-RE-0001",
            title="Modern 2BR Apartment",
            description="Beautiful modern apartment with sea view",
            location=kyrenia,
            property_type=apartment,
            bedrooms=2,
            bathrooms=1,
            total_area_sqm=85,
            furnished_status="FULLY_FURNISHED"
        )

        prop2 = Property.objects.create(
            reference_code="EI-RE-0002",
            title="Luxury 3BR Villa",
            description="Spacious villa with private pool",
            location=nicosia,
            property_type=villa,
            bedrooms=3,
            bathrooms=2,
            total_area_sqm=200,
            furnished_status="PARTLY_FURNISHED"
        )

        # Create sample listings
        listing1 = Listing.objects.create(
            reference_code="EI-L-0001",
            listing_type=daily_rental,
            property=prop1,
            title="Daily Rental: Modern 2BR Apartment",
            description="Perfect for short-term stays",
            base_price=Decimal("120.00"),
            currency="EUR",
            price_period="PER_NIGHT",
            is_active=True,
            status="ACTIVE"
        )

        listing2 = Listing.objects.create(
            reference_code="EI-L-0002",
            listing_type=long_term_rental,
            property=prop2,
            title="Long-term: Luxury 3BR Villa",
            description="Ideal for families",
            base_price=Decimal("1500.00"),
            currency="EUR",
            price_period="PER_MONTH",
            is_active=True,
            status="ACTIVE"
        )

        listing3 = Listing.objects.create(
            reference_code="EI-L-0003",
            listing_type=sale,
            property=prop1,
            title="For Sale: Modern 2BR Apartment",
            description="Investment opportunity",
            base_price=Decimal("250000.00"),
            currency="EUR",
            price_period="TOTAL",
            is_active=True,
            status="ACTIVE"
        )

        # Add features to properties
        wifi = Feature.objects.filter(code="WIFI").first()
        kitchen = Feature.objects.filter(code="KITCHEN").first()
        pool = Feature.objects.filter(code="PRIVATE_POOL").first()

        if wifi:
            PropertyFeature.objects.create(property=prop1, feature=wifi)
            PropertyFeature.objects.create(property=prop2, feature=wifi)

        if kitchen:
            PropertyFeature.objects.create(property=prop1, feature=kitchen)
            PropertyFeature.objects.create(property=prop2, feature=kitchen)

        if pool:
            PropertyFeature.objects.create(property=prop2, feature=pool)

        self.stdout.write(self.style.SUCCESS("✓ Created sample listings and properties"))