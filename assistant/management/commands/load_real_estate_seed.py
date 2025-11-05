import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from real_estate.models import Listing


class Command(BaseCommand):
    help = "Load canonical real estate listings from fixtures (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            type=str,
            help="Optional path to listings JSON. Defaults to agents/real_estate/fixtures/listings.json",
        )
        parser.add_argument(
            "--truncate",
            action="store_true",
            help="Delete existing listings before loading.",
        )

    def handle(self, *args, **options):
        fixture_path = (
            Path(options["path"]).resolve()
            if options.get("path")
            else Path(__file__)
            .resolve()
            .parents[3]
            / "assistant"
            / "agents"
            / "real_estate"
            / "fixtures"
            / "listings.json"
        )

        if not fixture_path.exists():
            raise FileNotFoundError(f"Fixture not found: {fixture_path}")

        with fixture_path.open("r", encoding="utf-8") as fh:
            payload = json.load(fh)

        if not isinstance(payload, list):
            raise ValueError("Expected fixture to be a list of listings.")

        self.stdout.write(self.style.NOTICE(f"Loading {len(payload)} listings from {fixture_path}"))

        with transaction.atomic():
            if options.get("truncate"):
                deleted, _ = Listing.objects.all().delete()
                self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing listings"))

            created = 0
            updated = 0

            for entry in payload:
                external_id = entry.get("id")
                if not external_id:
                    self.stdout.write(self.style.WARNING("Skipping entry without 'id'"))
                    continue

                title = entry.get("title") or "Untitled Property"
                city = entry.get("location") or entry.get("city") or "Kyrenia"
                area = entry.get("district") or entry.get("area") or ""
                bedrooms = int(entry.get("bedrooms") or 1)
                bathrooms = int(entry.get("bathrooms") or 1)
                sleeps = int(entry.get("sleeps") or max(2, bedrooms * 2))
                property_type = entry.get("property_type") or "apartment"
                amenities = list(entry.get("amenities") or [])
                description = entry.get("description") or ""
                photos = list(entry.get("photos") or [])
                price_per_night = entry.get("price_per_night")
                currency = entry.get("currency") or "GBP"

                if price_per_night is None:
                    self.stdout.write(self.style.WARNING(f"[{external_id}] Missing price_per_night; defaulting to 100"))
                    price_per_night = 100

                price_amount = int(round(float(price_per_night)))

                defaults = {
                    "title": title,
                    "description": description,
                    "tenure": "short_term",
                    "price_amount": price_amount,
                    "price_unit": "per_night",
                    "currency": currency,
                    "bedrooms": bedrooms,
                    "bathrooms": bathrooms,
                    "max_guests": sleeps,
                    "property_type": property_type,
                    "amenities": amenities,
                    "city": city,
                    "area": area,
                    "address": entry.get("address", ""),
                    "min_stay_nights": entry.get("min_stay_nights", 1),
                    "min_lease_months": entry.get("min_lease_months", 1),
                    "available_from": entry.get("available_from"),
                    "image_url": photos[0] if photos else "",
                    "additional_images": photos[1:] if len(photos) > 1 else [],
                    "is_active": True,
                }

                obj, created_flag = Listing.objects.update_or_create(
                    external_id=external_id,
                    defaults=defaults,
                )
                if created_flag:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Real estate seed complete. created={created} updated={updated}")
        )
