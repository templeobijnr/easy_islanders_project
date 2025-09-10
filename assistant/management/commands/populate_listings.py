import random
import uuid
from typing import List

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from assistant.models import Listing


AREAS: List[str] = [
    "kyrenia", "catalkoy", "alsancak", "lapta", "karsiyaka", "esentepe", "karakum", "ozankoy",
    "nicosia", "famagusta", "iskele", "guzelyurt", "karpaz",
]


class Command(BaseCommand):
    help = "Populate internal Listing DB with sample listings across the island. Optionally update existing contact info."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=40, help="Number of listings to create")
        parser.add_argument("--phone", type=str, required=True, help="Contact phone/WhatsApp number to set for all listings")
        parser.add_argument("--type", type=str, default="property_rent", choices=["property_rent", "property_sale"], help="Listing type")
        parser.add_argument("--update-existing-only", action="store_true", help="Only update existing listings' contact_info with the provided phone")

    def handle(self, *args, **options):
        count: int = options["count"]
        phone: str = options["phone"]
        listing_type: str = options["type"]
        update_only: bool = options["update_existing_only"]

        if not phone.startswith("+"):
            raise CommandError("Phone must be in E.164 format starting with '+'.")

        if update_only:
            updated = 0
            for lst in Listing.objects.all().iterator():
                sd = lst.structured_data or {}
                contact = sd.get("contact_info") or {}
                if not isinstance(contact, dict):
                    contact = {"contact_number": str(contact)}
                contact.update({"whatsapp": phone, "phone": phone, "contact_number": phone})
                sd["contact_info"] = contact
                lst.structured_data = sd
                lst.save(update_fields=["structured_data", "updated_at"])
                updated += 1
            self.stdout.write(self.style.SUCCESS(f"Updated contact info for {updated} existing listings."))
            return

        self.stdout.write(self.style.WARNING("Creating sample listings..."))

        created = 0
        for i in range(count):
            area = random.choice(AREAS)
            bedrooms = random.choice([1, 2, 2, 3, 4])
            currency = "GBP"
            if listing_type == "property_rent":
                price = random.choice([350, 450, 500, 600, 700, 800, 900, 1000, 1200])
            else:
                price = random.choice([95000, 120000, 160000, 200000, 250000, 300000])

            sd = {
                "title": f"{bedrooms}+1 in {area.title()}",
                "description": f"Spacious {bedrooms}+1 {('rental' if listing_type=='property_rent' else 'for sale')} in {area.title()}.",
                "location": area,
                "bedrooms": bedrooms,
                "listing_type": listing_type,
                "features": ["balcony", "parking"],
                "contact_info": {"whatsapp": phone, "phone": phone, "contact_number": phone},
                "image_urls": [],
            }

            lst = Listing(
                source_name="DevSeed",
                source_id=f"dev_{uuid.uuid4()}",
                source_url="",
                posted_at=timezone.now(),
                raw_text=f"{bedrooms}+1 {listing_type.replace('_', ' ')} in {area}. Contact {phone}",
                structured_data=sd,
                listing_type=listing_type,
                location=area,
                price=price,
                currency=currency,
                is_active=True,
            )
            lst.save()
            created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created} listings of type {listing_type} with contact {phone}."))


