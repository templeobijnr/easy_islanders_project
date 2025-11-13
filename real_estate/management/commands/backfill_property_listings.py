from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction

from real_estate.models import Listing as REListing
from real_estate.services import ensure_listing_for_property


class Command(BaseCommand):
    help = "Backfill generic listings for real estate properties. Assigns a specified owner to created listings."

    def add_arguments(self, parser):
        parser.add_argument('--owner-id', type=int, required=True, help='User ID to assign as owner for created listings')
        parser.add_argument('--dry-run', action='store_true', default=False)

    @transaction.atomic
    def handle(self, *args, **options):
        owner_id = options['owner_id']
        dry_run = options['dry_run']
        User = get_user_model()

        try:
            owner = User.objects.get(id=owner_id)
        except User.DoesNotExist:
            raise CommandError(f"User with id={owner_id} does not exist")

        props = REListing.objects.filter(listing__isnull=True)
        total = props.count()
        created = 0

        self.stdout.write(f"Scanning {total} properties without generic listing…")
        for prop in props.iterator():
            if dry_run:
                self.stdout.write(f"DRY RUN: would create listing for property {prop.id} - {prop.title}")
                continue
            ensure_listing_for_property(prop, owner=owner)
            created += 1

        self.stdout.write(self.style.SUCCESS(f"Done. Created {created} listings (out of {total})."))

