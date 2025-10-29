from __future__ import annotations

from django.core.management.base import BaseCommand
from router_service.models import IntentExemplar
from router_service.embedding import embed_text


SEEDS = {
    'property_search@v1': [
        'apartment for rent in kyrenia',
        'villa in nicosia',
        'studio near university',
        'property listing with sea view',
        'two bedroom apartment in girne'
    ],
    'product_search@v1': [
        'used car for sale',
        'second-hand iphone 12',
        'buy electronics in kyrenia',
        'gaming laptop used',
        'cheap mobile phone'
    ],
    'local_lookup@v1': [
        'pharmacy on duty in nicosia',
        'nearest hospital',
        'doctor appointment in kyrenia',
        'emergency clinic nearby',
        '24h pharmacy'
    ],
    'greeting@v1': [
        'hello', 'hi there', 'good morning', 'good afternoon', 'good evening'
    ],
}


class Command(BaseCommand):
    help = "Seed intent exemplars for demo and retrieval testing (dev mode)."

    def handle(self, *args, **options):
        created = 0
        for intent_key, phrases in SEEDS.items():
            for text in phrases:
                if IntentExemplar.objects.filter(intent_key=intent_key, text=text).exists():
                    continue
                vec = embed_text(text)
                IntentExemplar.objects.create(intent_key=intent_key, text=text, vector=vec)
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} exemplars"))

