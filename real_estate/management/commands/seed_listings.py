"""
Seed realistic Real Estate listings for development and testing.

Usage:
    python manage.py seed_listings --flush=false --count=120

Generates balanced mix of short-term and long-term listings across North Cyprus cities.
Idempotent: Uses deterministic UUIDs based on title+city+bedrooms.
"""
import random
import uuid
from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from real_estate.models import Listing, ShortTermBlock


# City data with typical price ranges (GBP)
CITIES = {
    "Girne": {
        "aliases": ["Kyrenia", "Girne"],
        "districts": ["Karakum", "Alsancak", "Lapta", "Çatalköy", "Esentepe"],
        "lt_price_range": (450, 1500),
        "st_price_range": (40, 180),
        "lat_range": (35.330, 35.370),
        "lng_range": (33.310, 33.350),
    },
    "Lefkoşa": {
        "aliases": ["Nicosia", "Lefkoşa", "Lefkosa"],
        "districts": ["Gönyeli", "Ortaköy", "Hamitköy", "Dikmen"],
        "lt_price_range": (400, 1200),
        "st_price_range": (35, 150),
        "lat_range": (35.180, 35.220),
        "lng_range": (33.350, 33.390),
    },
    "Gazimağusa": {
        "aliases": ["Famagusta", "Gazimağusa", "Mağusa"],
        "districts": ["Salamis", "Tuzla", "Boğaz", "Yeni Boğaziçi"],
        "lt_price_range": (350, 1000),
        "st_price_range": (30, 120),
        "lat_range": (35.110, 35.150),
        "lng_range": (33.930, 33.970),
    },
    "İskele": {
        "aliases": ["İskele", "Iskele", "Trikomo"],
        "districts": ["Boğaz", "Yeni Boğaziçi", "Bafra"],
        "lt_price_range": (300, 900),
        "st_price_range": (25, 100),
        "lat_range": (35.270, 35.310),
        "lng_range": (33.890, 33.930),
    },
}

# Property types with typical specs
PROPERTY_TYPES = ["apartment", "villa", "studio", "house", "penthouse"]

# Common amenities
AMENITIES = [
    "ac", "wifi", "sea_view", "pool", "parking", "garden",
    "balcony", "terrace", "elevator", "security", "furnished",
    "dishwasher", "washing_machine", "gym", "beach_access",
]

# Agency names
AGENCIES = [
    "Harbour Homes", "Cyprus Dream Villas", "Mediterranean Properties",
    "North Cyprus Rentals", "Aegean Real Estate", "Island Living",
    "Sunset Properties", "Coastal Estates", "Premier Rentals", "",
]

# Placeholder image CDN
IMAGE_BASE = "https://images.example.com/cyprus"


def generate_deterministic_uuid(title: str, city: str, bedrooms: int) -> uuid.UUID:
    """Generate deterministic UUID for idempotent seeding."""
    seed_string = f"{title}|{city}|{bedrooms}"
    return uuid.uuid5(uuid.NAMESPACE_DNS, seed_string)


def generate_listing_data(idx: int, rent_type: str, city_name: str, city_data: dict) -> dict:
    """Generate realistic listing data."""
    bedrooms = random.choices([1, 2, 3, 4], weights=[15, 50, 25, 10])[0]
    bathrooms = Decimal(str(random.choice([1.0, 1.5, 2.0, 2.5, 3.0])))
    property_type = random.choices(PROPERTY_TYPES, weights=[50, 15, 20, 10, 5])[0]
    district = random.choice(city_data["districts"])

    # Generate title
    if property_type == "studio":
        title = f"{property_type.title()} in {district}"
    else:
        title = f"{bedrooms}BR {property_type.title()} in {district}"

    descriptors = ["Modern", "Spacious", "Cozy", "Bright", "Renovated",
                   "Sea-view", "Quiet", "Central", "Luxury", "Charming"]
    title = f"{random.choice(descriptors)} {title}"

    listing_id = generate_deterministic_uuid(title, city_name, bedrooms)

    description = (
        f"Beautiful {bedrooms}-bedroom {property_type} located in {district}, {city_name}. "
        f"This property features {bathrooms} bathrooms and comes with modern amenities."
    )

    num_amenities = random.randint(5, 8)
    listing_amenities = random.sample(AMENITIES, num_amenities)

    num_images = random.randint(3, 5)
    images = [f"{IMAGE_BASE}/{city_name.lower()}/{property_type}/{idx}_{i}.jpg" for i in range(num_images)]

    lat = Decimal(str(round(random.uniform(*city_data["lat_range"]), 6)))
    lng = Decimal(str(round(random.uniform(*city_data["lng_range"]), 6)))

    agency_name = random.choice(AGENCIES)
    rating = round(random.uniform(3.5, 5.0), 1) if random.random() > 0.3 else None

    data = {
        "id": listing_id,
        "title": title,
        "description": description,
        "city": city_name,
        "district": district,
        "lat": lat,
        "lng": lng,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "property_type": property_type,
        "rent_type": rent_type,
        "currency": "GBP",
        "amenities": listing_amenities,
        "images": images,
        "agency_name": agency_name,
        "rating": rating,
    }

    if rent_type in ("long_term", "both"):
        lt_min, lt_max = city_data["lt_price_range"]
        base_price = random.randint(lt_min, lt_max)
        monthly_price = base_price + (bedrooms - 1) * 100
        data["monthly_price"] = monthly_price
        data["min_term_months"] = random.choice([6, 12, 12, 24])
        data["deposit"] = monthly_price * random.choice([1, 2])
        days_until_available = random.randint(0, 90)
        data["available_from"] = date.today() + timedelta(days=days_until_available)

    if rent_type in ("short_term", "both"):
        st_min, st_max = city_data["st_price_range"]
        base_price = random.randint(st_min, st_max)
        nightly_price = base_price + (bedrooms - 1) * 15
        data["nightly_price"] = nightly_price
        data["min_nights"] = random.choice([1, 2, 3, 7])

    return data


def generate_short_term_blocks(listing: Listing) -> list:
    """Generate 8-12 random blocked date ranges over next 90 days."""
    if listing.rent_type not in ("short_term", "both"):
        return []

    blocks = []
    today = date.today()
    num_blocks = random.randint(8, 12)

    for _ in range(num_blocks):
        start_offset = random.randint(0, 75)
        start_date = today + timedelta(days=start_offset)
        duration = random.randint(2, 7)
        end_date = start_date + timedelta(days=duration - 1)

        blocks.append({"listing": listing, "start_date": start_date, "end_date": end_date})

    return blocks


class Command(BaseCommand):
    help = "Seed realistic Real Estate listings for development"

    def add_arguments(self, parser):
        parser.add_argument("--flush", type=str, default="false", help="Flush existing listings before seeding (true/false)")
        parser.add_argument("--count", type=int, default=120, help="Total number of listings to create (default: 120)")

    def handle(self, *args, **options):
        flush = options["flush"].lower() == "true"
        count = options["count"]

        if flush:
            self.stdout.write(self.style.WARNING("Flushing existing listings..."))
            ShortTermBlock.objects.all().delete()
            Listing.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("✓ Flushed"))

        self.stdout.write(f"Seeding {count} listings...")

        cities = list(CITIES.keys())
        num_cities = len(cities)

        num_lt = count // 2
        num_st = count // 2
        num_both = count - num_lt - num_st

        rent_types = ["long_term"] * num_lt + ["short_term"] * num_st + ["both"] * num_both
        random.shuffle(rent_types)

        created_listings = 0
        created_blocks = 0

        for idx, rent_type in enumerate(rent_types):
            city_name = cities[idx % num_cities]
            city_data = CITIES[city_name]

            listing_data = generate_listing_data(idx, rent_type, city_name, city_data)

            listing, created = Listing.objects.update_or_create(
                id=listing_data["id"],
                defaults=listing_data
            )

            if created:
                created_listings += 1

            if rent_type in ("short_term", "both"):
                ShortTermBlock.objects.filter(listing=listing).delete()

                blocks_data = generate_short_term_blocks(listing)
                for block_data in blocks_data:
                    ShortTermBlock.objects.create(**block_data)
                    created_blocks += 1

        self.stdout.write(self.style.SUCCESS(f"✓ Seeded {created_listings} new listings, {created_blocks} short-term blocks"))
        self.stdout.write(f"Total listings in DB: {Listing.objects.count()}")
        self.stdout.write(f"  - Long-term: {Listing.objects.filter(rent_type='long_term').count()}")
        self.stdout.write(f"  - Short-term: {Listing.objects.filter(rent_type='short_term').count()}")
        self.stdout.write(f"  - Both: {Listing.objects.filter(rent_type='both').count()}")
