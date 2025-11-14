"""
Management command to seed real estate reference data.

This command populates the database with essential reference data:
- Listing types (daily rental, long-term rental, sale, project)
- Property types (apartment, villa, penthouse, etc.)
- Feature categories and features (inside, outside, view, amenity)
- Title deed types
- Utility types
- Tax types
- Sample locations

Usage:
    python manage.py seed_real_estate_data [--clear]

Options:
    --clear    Clear existing reference data before seeding (WARNING: destructive)
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from real_estate.models import (
    ListingType,
    PropertyType,
    FeatureCategory,
    Feature,
    TitleDeedType,
    UtilityType,
    TaxType,
    Location,
)


class Command(BaseCommand):
    help = "Seed real estate reference data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing reference data before seeding",
        )

    def handle(self, *args, **options):
        with transaction.atomic():
            if options["clear"]:
                self.stdout.write(
                    self.style.WARNING("⚠️  Clearing existing reference data...")
                )
                self._clear_data()
                self.stdout.write(self.style.SUCCESS("✓ Data cleared"))

            self.stdout.write("🌱 Seeding reference data...")

            # Seed in dependency order
            self._seed_listing_types()
            self._seed_property_types()
            self._seed_feature_categories_and_features()
            self._seed_title_deed_types()
            self._seed_utility_types()
            self._seed_tax_types()
            self._seed_sample_locations()

            self.stdout.write(self.style.SUCCESS("\n✅ All reference data seeded successfully!"))

    def _clear_data(self):
        """Clear all reference data (WARNING: destructive)."""
        Feature.objects.all().delete()
        FeatureCategory.objects.all().delete()
        PropertyType.objects.all().delete()
        ListingType.objects.all().delete()
        TitleDeedType.objects.all().delete()
        UtilityType.objects.all().delete()
        TaxType.objects.all().delete()
        # Note: Not clearing Location as it might be referenced by actual data

    def _seed_listing_types(self):
        """Seed the four core listing types."""
        types = [
            {"code": "DAILY_RENTAL", "label": "Daily Rental (Short-Term)"},
            {"code": "LONG_TERM_RENTAL", "label": "Long-Term Rental"},
            {"code": "SALE", "label": "For Sale"},
            {"code": "PROJECT", "label": "Project (Off-Plan Development)"},
        ]

        for data in types:
            obj, created = ListingType.objects.get_or_create(
                code=data["code"], defaults={"label": data["label"]}
            )
            if created:
                self.stdout.write(f"  ✓ Created listing type: {data['label']}")
            else:
                self.stdout.write(f"  → Existing listing type: {data['label']}")

    def _seed_property_types(self):
        """Seed property types."""
        types = [
            # Residential
            {"code": "APARTMENT", "label": "Apartment", "category": "RESIDENTIAL"},
            {"code": "PENTHOUSE", "label": "Penthouse", "category": "RESIDENTIAL"},
            {"code": "VILLA_DETACHED", "label": "Detached Villa", "category": "RESIDENTIAL"},
            {"code": "VILLA_SEMI_DETACHED", "label": "Semi-Detached Villa", "category": "RESIDENTIAL"},
            {"code": "BUNGALOW", "label": "Bungalow", "category": "RESIDENTIAL"},
            {"code": "DUPLEX", "label": "Duplex", "category": "RESIDENTIAL"},
            {"code": "TRIPLEX", "label": "Triplex", "category": "RESIDENTIAL"},
            {"code": "STUDIO", "label": "Studio", "category": "RESIDENTIAL"},
            {"code": "TOWNHOUSE", "label": "Townhouse", "category": "RESIDENTIAL"},
            # Commercial
            {"code": "OFFICE", "label": "Office", "category": "COMMERCIAL"},
            {"code": "RETAIL", "label": "Retail Space", "category": "COMMERCIAL"},
            {"code": "WAREHOUSE", "label": "Warehouse", "category": "COMMERCIAL"},
            {"code": "HOTEL", "label": "Hotel", "category": "COMMERCIAL"},
            # Land
            {"code": "LAND_RESIDENTIAL", "label": "Residential Land", "category": "LAND"},
            {"code": "LAND_COMMERCIAL", "label": "Commercial Land", "category": "LAND"},
            {"code": "LAND_AGRICULTURAL", "label": "Agricultural Land", "category": "LAND"},
        ]

        for data in types:
            obj, created = PropertyType.objects.get_or_create(
                code=data["code"],
                defaults={"label": data["label"], "category": data["category"]},
            )
            if created:
                self.stdout.write(f"  ✓ Created property type: {data['label']}")

    def _seed_feature_categories_and_features(self):
        """Seed feature categories and features."""
        # First, create categories
        categories = [
            {"code": "INSIDE", "label": "Inside Features"},
            {"code": "OUTSIDE", "label": "Outside Features"},
            {"code": "VIEW", "label": "Views"},
            {"code": "AMENITY", "label": "Amenities"},
        ]

        category_map = {}
        for data in categories:
            obj, created = FeatureCategory.objects.get_or_create(
                code=data["code"], defaults={"label": data["label"]}
            )
            category_map[data["code"]] = obj
            if created:
                self.stdout.write(f"  ✓ Created feature category: {data['label']}")

        # Now, create features
        features = [
            # Inside features
            {"code": "BALCONY", "label": "Balcony", "category": "INSIDE", "required_daily": False},
            {"code": "MASTER_CABINET", "label": "Master Cabinet", "category": "INSIDE", "required_daily": False},
            {"code": "FIRE_ALARM", "label": "Fire Alarm", "category": "INSIDE", "required_daily": False},
            {"code": "MASTER_BEDROOM", "label": "Master Bedroom", "category": "INSIDE", "required_daily": False},
            {"code": "WC", "label": "WC", "category": "INSIDE", "required_daily": False},
            {"code": "LAUNDRY_ROOM", "label": "Laundry Room", "category": "INSIDE", "required_daily": False},
            {"code": "INTERCOM", "label": "Intercom", "category": "INSIDE", "required_daily": False},
            {"code": "WALLPAPER", "label": "Wallpaper", "category": "INSIDE", "required_daily": False},
            {"code": "FIREPLACE", "label": "Fireplace", "category": "INSIDE", "required_daily": False},
            {"code": "NATURAL_MARBLE", "label": "Natural Marble", "category": "INSIDE", "required_daily": False},
            {"code": "AIR_CONDITION", "label": "Air Conditioning", "category": "INSIDE", "required_daily": False},
            {"code": "TV_INFRASTRUCTURE", "label": "TV Infrastructure", "category": "INSIDE", "required_daily": False},
            {"code": "WATER_TANK", "label": "Water Tank", "category": "INSIDE", "required_daily": False},
            {"code": "KITCHEN", "label": "Kitchen", "category": "INSIDE", "required_daily": True},
            {"code": "STORAGE_ROOM", "label": "Storage Room", "category": "INSIDE", "required_daily": False},
            {"code": "ENSUITE_BATHROOM", "label": "En-suite Bathroom", "category": "INSIDE", "required_daily": False},
            {"code": "WALK_IN_CLOSET", "label": "Walk-in Closet", "category": "INSIDE", "required_daily": False},
            {"code": "HARDWOOD_FLOORS", "label": "Hardwood Floors", "category": "INSIDE", "required_daily": False},
            {"code": "CEILING_FAN", "label": "Ceiling Fan", "category": "INSIDE", "required_daily": False},

            # Outside features
            {"code": "CLOSED_PARK", "label": "Closed Parking", "category": "OUTSIDE", "required_daily": False},
            {"code": "ELEVATOR", "label": "Elevator", "category": "OUTSIDE", "required_daily": False},
            {"code": "GARAGE", "label": "Garage", "category": "OUTSIDE", "required_daily": False},
            {"code": "TERRACE", "label": "Terrace", "category": "OUTSIDE", "required_daily": False},
            {"code": "BBQ", "label": "BBQ Area", "category": "OUTSIDE", "required_daily": False},
            {"code": "PUBLIC_POOL", "label": "Public Pool", "category": "OUTSIDE", "required_daily": False},
            {"code": "GARDEN", "label": "Garden", "category": "OUTSIDE", "required_daily": False},
            {"code": "SHARED_POOL", "label": "Shared Pool", "category": "OUTSIDE", "required_daily": False},
            {"code": "BOUNDING_WALL", "label": "Bounding Wall", "category": "OUTSIDE", "required_daily": False},
            {"code": "PRIVATE_POOL", "label": "Private Pool", "category": "OUTSIDE", "required_daily": False},
            {"code": "SECURITY_CAM", "label": "Security Camera", "category": "OUTSIDE", "required_daily": False},
            {"code": "GENERATOR", "label": "Generator", "category": "OUTSIDE", "required_daily": False},
            {"code": "CAR_PARK", "label": "Car Park", "category": "OUTSIDE", "required_daily": False},
            {"code": "AUTO_PARK", "label": "Automated Parking", "category": "OUTSIDE", "required_daily": False},
            {"code": "WATER_WELL", "label": "Water Well", "category": "OUTSIDE", "required_daily": False},
            {"code": "YELLOW_STONE_HOUSE", "label": "Yellow Stone House", "category": "OUTSIDE", "required_daily": False},
            {"code": "PLAYGROUND", "label": "Playground", "category": "OUTSIDE", "required_daily": False},
            {"code": "GYM", "label": "Gym/Fitness Center", "category": "OUTSIDE", "required_daily": False},
            {"code": "SAUNA", "label": "Sauna", "category": "OUTSIDE", "required_daily": False},
            {"code": "TENNIS_COURT", "label": "Tennis Court", "category": "OUTSIDE", "required_daily": False},
            {"code": "BASKETBALL_COURT", "label": "Basketball Court", "category": "OUTSIDE", "required_daily": False},

            # Views
            {"code": "SEA_VIEW", "label": "Sea View", "category": "VIEW", "required_daily": False},
            {"code": "MOUNTAIN_VIEW", "label": "Mountain View", "category": "VIEW", "required_daily": False},
            {"code": "CITY_VIEW", "label": "City View", "category": "VIEW", "required_daily": False},
            {"code": "GARDEN_VIEW", "label": "Garden View", "category": "VIEW", "required_daily": False},
            {"code": "POOL_VIEW", "label": "Pool View", "category": "VIEW", "required_daily": False},

            # Amenities (especially for short-term)
            {"code": "WIFI", "label": "Wi-Fi", "category": "AMENITY", "required_daily": True},
            {"code": "FULLY_EQUIPPED_KITCHEN", "label": "Fully Equipped Kitchen", "category": "AMENITY", "required_daily": False},
            {"code": "WASHING_MACHINE", "label": "Washing Machine", "category": "AMENITY", "required_daily": False},
            {"code": "DRYER", "label": "Dryer", "category": "AMENITY", "required_daily": False},
            {"code": "DISHWASHER", "label": "Dishwasher", "category": "AMENITY", "required_daily": False},
            {"code": "MICROWAVE", "label": "Microwave", "category": "AMENITY", "required_daily": False},
            {"code": "COFFEE_MACHINE", "label": "Coffee Machine", "category": "AMENITY", "required_daily": False},
            {"code": "TV_SATELLITE", "label": "Satellite TV", "category": "AMENITY", "required_daily": False},
            {"code": "SMART_TV", "label": "Smart TV", "category": "AMENITY", "required_daily": False},
            {"code": "NETFLIX", "label": "Netflix", "category": "AMENITY", "required_daily": False},
            {"code": "PARKING_SPACE", "label": "Parking Space", "category": "AMENITY", "required_daily": False},
            {"code": "WHEELCHAIR_ACCESSIBLE", "label": "Wheelchair Accessible", "category": "AMENITY", "required_daily": False},
            {"code": "PET_FRIENDLY", "label": "Pet Friendly", "category": "AMENITY", "required_daily": False},
            {"code": "CONCIERGE", "label": "Concierge Service", "category": "AMENITY", "required_daily": False},
            {"code": "24_7_SECURITY", "label": "24/7 Security", "category": "AMENITY", "required_daily": False},
        ]

        for data in features:
            category = category_map[data["category"]]
            obj, created = Feature.objects.get_or_create(
                code=data["code"],
                defaults={
                    "label": data["label"],
                    "category": category,
                    "is_required_for_daily_rental": data["required_daily"],
                },
            )
            if created:
                marker = "⭐" if data["required_daily"] else "✓"
                self.stdout.write(f"  {marker} Created feature: {data['label']}")

    def _seed_title_deed_types(self):
        """Seed title deed types."""
        types = [
            {"code": "TURKISH", "label": "Turkish Title Deed"},
            {"code": "EXCHANGE", "label": "Exchange Title Deed"},
            {"code": "KOCAN", "label": "Koçan (Long-term Lease)"},
            {"code": "TRNC", "label": "TRNC Title Deed"},
            {"code": "BRITISH", "label": "British Title Deed"},
        ]

        for data in types:
            obj, created = TitleDeedType.objects.get_or_create(
                code=data["code"], defaults={"label": data["label"]}
            )
            if created:
                self.stdout.write(f"  ✓ Created title deed type: {data['label']}")

    def _seed_utility_types(self):
        """Seed utility types."""
        types = [
            {"code": "ELECTRICITY", "label": "Electricity"},
            {"code": "WATER", "label": "Water"},
            {"code": "INTERNET", "label": "Internet"},
            {"code": "GAS", "label": "Gas"},
            {"code": "SEWAGE", "label": "Sewage"},
            {"code": "GARBAGE", "label": "Garbage Collection"},
        ]

        for data in types:
            obj, created = UtilityType.objects.get_or_create(
                code=data["code"], defaults={"label": data["label"]}
            )
            if created:
                self.stdout.write(f"  ✓ Created utility type: {data['label']}")

    def _seed_tax_types(self):
        """Seed tax types."""
        types = [
            {"code": "ELECTRICITY_TAX", "label": "Electricity Tax"},
            {"code": "WATER_TAX", "label": "Water Tax"},
            {"code": "PROPERTY_TAX", "label": "Property Tax"},
            {"code": "MUNICIPAL_TAX", "label": "Municipal Tax"},
            {"code": "COUNCIL_TAX", "label": "Council Tax"},
            {"code": "VAT", "label": "VAT (Value Added Tax)"},
        ]

        for data in types:
            obj, created = TaxType.objects.get_or_create(
                code=data["code"], defaults={"label": data["label"]}
            )
            if created:
                self.stdout.write(f"  ✓ Created tax type: {data['label']}")

    def _seed_sample_locations(self):
        """Seed sample locations in North Cyprus."""
        locations = [
            # Kyrenia region
            {"country": "Cyprus", "region": "North Cyprus", "city": "Kyrenia", "area": "City Center"},
            {"country": "Cyprus", "region": "North Cyprus", "city": "Kyrenia", "area": "Esentepe"},
            {"country": "Cyprus", "region": "North Cyprus", "city": "Kyrenia", "area": "Alsancak"},
            {"country": "Cyprus", "region": "North Cyprus", "city": "Kyrenia", "area": "Karaoglanoglu"},
            {"country": "Cyprus", "region": "North Cyprus", "city": "Kyrenia", "area": "Catalkoy"},
            {"country": "Cyprus", "region": "North Cyprus", "city": "Kyrenia", "area": "Bellapais"},
            {"country": "Cyprus", "region": "North Cyprus", "city": "Kyrenia", "area": "Lapta"},

            # Famagusta region
            {"country": "Cyprus", "region": "North Cyprus", "city": "Famagusta", "area": "City Center"},
            {"country": "Cyprus", "region": "North Cyprus", "city": "Famagusta", "area": "Long Beach"},
            {"country": "Cyprus", "region": "North Cyprus", "city": "Famagusta", "area": "Salamis"},

            # Nicosia region
            {"country": "Cyprus", "region": "North Cyprus", "city": "Nicosia", "area": "City Center"},
            {"country": "Cyprus", "region": "North Cyprus", "city": "Nicosia", "area": "Gönyeli"},
            {"country": "Cyprus", "region": "North Cyprus", "city": "Nicosia", "area": "Ortaköy"},
        ]

        for data in locations:
            obj, created = Location.objects.get_or_create(
                country=data["country"],
                region=data["region"],
                city=data["city"],
                area=data["area"],
            )
            if created:
                self.stdout.write(f"  ✓ Created location: {data['city']}, {data['area']}")
