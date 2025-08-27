# assistant/management/commands/populate_sample_data.py

from django.core.management.base import BaseCommand
from assistant.models import ServiceProvider, ServiceFeature, KnowledgeBase

# This class MUST be named 'Command' and it MUST NOT be indented.
class Command(BaseCommand):
    help = 'Populate the database with initial sample data for development.'

    # This 'handle' method MUST be indented inside the Command class.
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Deleting old data...'))
        ServiceProvider.objects.all().delete()
        KnowledgeBase.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Creating new sample data...'))

        # --- 1. Create Accommodation Provider ---
        hotel_1 = ServiceProvider.objects.create(
            name="Kyrenia Castle View Hotel",
            category="accommodation",
            contact_phone="+90 533 555 1234",
            location="Kyrenia Harbor",
            description="Luxury hotel with stunning harbor views and world-class amenities.",
            description_ru="Роскошный отель с потрясающим видом на гавань и первоклассными удобствами.",
            rating=4.9,
            price_range="€85-150/night",
            is_active=True,
            is_featured=True
        )
        ServiceFeature.objects.create(service_provider=hotel_1, feature_name="Sea View Rooms", feature_name_ru="Номера с видом на море")
        ServiceFeature.objects.create(service_provider=hotel_1, feature_name="Breakfast Included", feature_name_ru="Завтрак включен")
        ServiceFeature.objects.create(service_provider=hotel_1, feature_name="Pool & Spa", feature_name_ru="Бассейн и спа")
        self.stdout.write('Created: Kyrenia Castle View Hotel')

        # --- 2. Create Car Rental Provider ---
        car_rental_1 = ServiceProvider.objects.create(
            name="Cyprus Car Rentals",
            category="car_rental",
            contact_phone="+90 533 123 4567",
            location="Kyrenia",
            description="Modern fleet with full insurance coverage and 24/7 roadside assistance.",
            description_ru="Современный автопарк с полным страховым покрытием и круглосуточной помощью на дороге.",
            rating=4.8,
            price_range="€25-45/day",
            is_active=True,
            is_featured=True
        )
        ServiceFeature.objects.create(service_provider=car_rental_1, feature_name="Free Airport Pickup")
        ServiceFeature.objects.create(service_provider=car_rental_1, feature_name="Full Insurance")
        self.stdout.write('Created: Cyprus Car Rentals')

        # --- 3. Create Knowledge Base Article ---
        KnowledgeBase.objects.create(
            title="Currency and Payments",
            category="general",
            keywords="money, currency, payment, credit card, lira, euro",
            content_en="The official currency is the Turkish Lira (TL). However, Euros (€) and British Pounds (£) are widely accepted in tourist areas. Credit cards are accepted in most hotels and larger restaurants.",
            content_ru="Официальная валюта - турецкая лира (TL). Однако евро (€) и британские фунты (£) широко принимаются в туристических районах."
        )
        self.stdout.write('Created: KnowledgeBase Article on Currency')

        self.stdout.write(self.style.SUCCESS('Sample data populated successfully!'))