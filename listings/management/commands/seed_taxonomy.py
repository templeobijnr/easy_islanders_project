"""
Seed the canonical marketplace taxonomy (Categories + SubCategories).

Idempotent: safe to run multiple times. Updates names/description/schema
for existing slugs and creates any missing records.

Usage:
  python manage.py seed_taxonomy

Notes:
- Does not delete or deactivate pre-existing categories; only adds/updates
  the canonical set below.
- Category.schema is set to {"fields": [...]} for each domain.
"""

from __future__ import annotations

from typing import Dict, List, Any, Tuple

from django.core.management.base import BaseCommand
from django.db import transaction

from listings.models import Category, SubCategory


# Canonical taxonomy definition
TAXONOMY: Dict[str, Dict[str, Any]] = {
    "real_estate": {
        "name": "Real Estate",
        "description": "Homes, rentals, projects and land.",
        "is_bookable": False,
        "schema_fields": [
            {"name": "listing_type", "label": "Listing Type", "type": "select", "required": True, "choices": ["for_sale", "for_rent", "project"]},
            {"name": "rental_term", "label": "Rental Term", "type": "select", "required": False, "choices": ["short_term", "long_term"]},
            {"name": "bedrooms", "label": "Bedrooms", "type": "number", "required": False, "min": 0},
            {"name": "bathrooms", "label": "Bathrooms", "type": "number", "required": False, "min": 0},
            {"name": "size_sqm", "label": "Size (m²)", "type": "number", "required": False, "min": 0},
            {"name": "furnishing", "label": "Furnishing", "type": "select", "required": False, "choices": ["unfurnished", "part_furnished", "fully_furnished"]},
        ],
        "subcategories": [
            "apartment",
            "studio",
            "penthouse",
            "duplex",
            "villa",
            "house",
            "bungalow",
            "room",
            "student_accommodation",
            "holiday_home",
            "office",
            "shop_retail",
            "warehouse",
            "industrial",
            "coworking",
            "land_plot",
            "building_project",
        ],
    },
    "cars": {
        "name": "Cars & Vehicles",
        "description": "Cars, bikes and other vehicles for sale or rent.",
        "is_bookable": False,
        "schema_fields": [
            {"name": "transaction_type", "label": "Transaction Type", "type": "select", "required": True, "choices": ["sale", "rent"]},
            {"name": "condition", "label": "Condition", "type": "select", "required": True, "choices": ["new", "used"]},
            {"name": "brand", "label": "Brand", "type": "text", "required": True},
            {"name": "model", "label": "Model", "type": "text", "required": True},
            {"name": "year", "label": "Year", "type": "number", "required": True, "min": 1980, "max": 2100},
            {"name": "mileage_km", "label": "Mileage (km)", "type": "number", "required": False, "min": 0},
            {"name": "transmission", "label": "Transmission", "type": "select", "required": False, "choices": ["manual", "automatic"]},
            {"name": "fuel_type", "label": "Fuel Type", "type": "select", "required": False, "choices": ["petrol", "diesel", "hybrid", "electric", "other"]},
        ],
        "subcategories": [
            "sedan",
            "hatchback",
            "suv",
            "crossover",
            "coupe",
            "convertible",
            "van_minibus",
            "pickup",
            "truck",
            "motorbike",
            "scooter",
            "atv",
            "commercial_vehicle",
            "bus_coach",
            "boat_marine",
            "other_vehicle",
        ],
    },
    "services": {
        "name": "Services",
        "description": "Home, professional and personal services.",
        "is_bookable": True,
        "schema_fields": [
            {"name": "pricing_model", "label": "Pricing Model", "type": "select", "required": True, "choices": ["fixed_price", "hourly", "quote_based"]},
            {"name": "service_area", "label": "Service Area", "type": "text", "required": False, "placeholder": "Areas covered (e.g. Kyrenia, Nicosia)"},
            {"name": "experience_years", "label": "Years of Experience", "type": "number", "required": False, "min": 0},
            {"name": "availability_notes", "label": "Availability Notes", "type": "textarea", "required": False},
        ],
        "subcategories": [
            "home_services",
            "property_services",
            "professional_services",
            "business_services",
            "education_tutoring",
            "personal_services",
            "transport_logistics",
            "auto_services",
            "pet_services",
            "other_service",
        ],
    },
    "events": {
        "name": "Events",
        "description": "Tickets, shows, meetups and more.",
        "is_bookable": True,
        "schema_fields": [
            {"name": "start_date", "label": "Start Date", "type": "text", "required": True, "placeholder": "e.g. 2025-08-21 19:00"},
            {"name": "end_date", "label": "End Date", "type": "text", "required": False},
            {"name": "venue", "label": "Venue", "type": "text", "required": True},
            {"name": "age_restriction", "label": "Age Restriction", "type": "select", "required": False, "choices": ["all_ages", "16_plus", "18_plus"]},
            {"name": "ticket_required", "label": "Ticket Required", "type": "select", "required": True, "choices": ["yes", "no"]},
        ],
        "subcategories": [
            "concerts_shows",
            "nightlife_parties",
            "conferences_meetups",
            "workshops_classes",
            "sports_events",
            "festivals_fairs",
            "kids_family",
            "community_charity",
            "food_drink_events",
            "other_event",
        ],
    },
    "activities": {
        "name": "Activities",
        "description": "Experiences, tours and day activities.",
        "is_bookable": True,
        "schema_fields": [
            {"name": "duration", "label": "Duration", "type": "text", "required": True, "placeholder": "e.g. 3 hours"},
            {"name": "group_size", "label": "Max Group Size", "type": "number", "required": False, "min": 1},
            {"name": "difficulty_level", "label": "Difficulty Level", "type": "select", "required": False, "choices": ["easy", "moderate", "challenging"]},
            {"name": "includes_transport", "label": "Includes Transport", "type": "select", "required": False, "choices": ["yes", "no"]},
        ],
        "subcategories": [
            "tours_excursions",
            "boat_yacht_tours",
            "water_sports",
            "adventure_outdoor",
            "classes_lessons",
            "wellness_retreats",
            "sports_lessons",
            "kids_activities",
            "other_activity",
        ],
    },
    "health_beauty": {
        "name": "Health & Beauty",
        "description": "Clinics, dentists, gyms and salons.",
        "is_bookable": True,
        "schema_fields": [
            {"name": "service_type", "label": "Service Type", "type": "text", "required": False, "placeholder": "E.g. dental check-up, full body massage"},
            {"name": "accepts_walkins", "label": "Accepts Walk-ins", "type": "select", "required": False, "choices": ["yes", "no"]},
            {"name": "has_parking", "label": "On-site Parking", "type": "select", "required": False, "choices": ["yes", "no"]},
            {"name": "languages_spoken", "label": "Languages Spoken", "type": "text", "required": False},
        ],
        "subcategories": [
            "dentist",
            "doctor_clinic",
            "hospital_medical_center",
            "laboratory_diagnostics",
            "physiotherapy",
            "spa_massage",
            "hair_salon",
            "barber_shop",
            "nails_salon",
            "aesthetic_clinic",
            "gym_fitness_center",
            "yoga_pilates_studio",
            "personal_trainer",
            "nutritionist_dietician",
            "other_health_beauty",
        ],
    },
    "products": {
        "name": "Products",
        "description": "Electronics, furniture, fashion and more.",
        "is_bookable": False,
        "schema_fields": [
            {"name": "condition", "label": "Condition", "type": "select", "required": True, "choices": ["new", "used", "refurbished"]},
            {"name": "brand", "label": "Brand", "type": "text", "required": False},
            {"name": "model", "label": "Model", "type": "text", "required": False},
            {"name": "colour", "label": "Colour", "type": "text", "required": False},
            {"name": "warranty", "label": "Warranty", "type": "select", "required": False, "choices": ["no_warranty", "seller_warranty", "manufacturer_warranty"]},
        ],
        "subcategories": [
            "electronics",
            "computers_accessories",
            "tv_audio_video",
            "home_appliances",
            "kitchen_appliances",
            "furniture",
            "home_decor",
            "garden_outdoor",
            "fashion_men",
            "fashion_women",
            "fashion_kids",
            "shoes_bags",
            "sports_outdoors",
            "toys_games",
            "books_media",
            "office_school",
            "pets_products",
            "car_parts_accessories",
            "other_product",
        ],
    },
    "restaurants": {
        "name": "Restaurants & Food",
        "description": "Restaurants, cafes and food venues.",
        "is_bookable": True,
        "schema_fields": [
            {"name": "cuisine_type", "label": "Cuisine Type", "type": "text", "required": False, "placeholder": "E.g. Turkish, Italian, Sushi"},
            {"name": "price_range", "label": "Price Range", "type": "select", "required": False, "choices": ["budget", "mid_range", "premium"]},
            {"name": "serves_alcohol", "label": "Serves Alcohol", "type": "select", "required": False, "choices": ["yes", "no"]},
            {"name": "has_delivery", "label": "Offers Delivery", "type": "select", "required": False, "choices": ["yes", "no"]},
            {"name": "has_takeaway", "label": "Offers Takeaway", "type": "select", "required": False, "choices": ["yes", "no"]},
        ],
        "subcategories": [
            "restaurant",
            "cafe",
            "bar_pub",
            "fast_food",
            "bakery_pastry",
            "desserts_icecream",
            "coffee_shop",
            "delivery_only",
            "takeaway_spot",
            "shisha_lounge",
            "other_food_venue",
        ],
    },
}


def _title_from_slug(slug: str) -> str:
    return slug.replace("_", " ").title()


class Command(BaseCommand):
    help = "Seed canonical marketplace taxonomy (categories + subcategories)."

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        created: int = 0
        updated: int = 0
        sub_created: int = 0
        sub_updated: int = 0

        for order, (slug, cfg) in enumerate(TAXONOMY.items(), start=1):
            defaults = {
                "name": cfg["name"],
                "description": cfg.get("description", ""),
                "is_active": True,
                "is_bookable": bool(cfg.get("is_bookable", False)),
                "display_order": order,
            }

            category, was_created = Category.objects.get_or_create(
                slug=slug,
                defaults=defaults,
            )

            if not was_created:
                # Update core fields in case of changes
                for k, v in defaults.items():
                    setattr(category, k, v)
                updated += 1
            else:
                created += 1

            # Always ensure schema is current
            category.schema = {"fields": cfg.get("schema_fields", [])}
            category.save()

            # Subcategories
            for idx, sub_slug in enumerate(cfg.get("subcategories", []), start=1):
                sub_defaults = {
                    "name": _title_from_slug(sub_slug),
                    "description": "",
                    "display_order": idx,
                }
                sub, sub_was_created = SubCategory.objects.update_or_create(
                    category=category,
                    slug=sub_slug,
                    defaults=sub_defaults,
                )
                if sub_was_created:
                    sub_created += 1
                else:
                    sub_updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Taxonomy seeded. Categories created/updated: {created}/{updated}. "
                f"Subcategories created/updated: {sub_created}/{sub_updated}."
            )
        )

