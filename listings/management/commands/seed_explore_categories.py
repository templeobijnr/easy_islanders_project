"""
Django management command to seed Explore North Cyprus categories and sample listings.

Usage:
    python manage.py seed_explore_categories
    python manage.py seed_explore_categories --clear  # Clear existing first
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from listings.models import Category, SubCategory, Listing, ListingImage
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed Explore North Cyprus categories, subcategories, and sample listings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing categories and listings before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            Category.objects.filter(is_featured_category=True).delete()
            self.stdout.write(self.style.SUCCESS('Cleared!'))

        self.stdout.write('Seeding Explore categories...')

        # Get or create a demo user for listings
        demo_user, _ = User.objects.get_or_create(
            username='demo_seller',
            defaults={'email': 'demo@easyislanders.com'}
        )

        # Define category structure
        categories_data = [
            {
                'name': 'Properties',
                'slug': 'properties',
                'description': 'Find your perfect place in North Cyprus',
                'icon': 'home',
                'color': '#6CC24A',
                'is_bookable': True,
                'display_order': 1,
                'subcategories': [
                    {'name': 'Daily Rental', 'slug': 'daily-rental'},
                    {'name': 'Long-term Rental', 'slug': 'long-term'},
                    {'name': 'For Sale', 'slug': 'sale'},
                    {'name': 'Projects', 'slug': 'projects'},
                ],
                'schema': {
                    'fields': [
                        {'name': 'bedrooms', 'type': 'number', 'label': 'Bedrooms'},
                        {'name': 'bathrooms', 'type': 'number', 'label': 'Bathrooms'},
                        {'name': 'square_meters', 'type': 'number', 'label': 'Size (m²)'},
                        {'name': 'furnished', 'type': 'boolean', 'label': 'Furnished'},
                        {'name': 'parking', 'type': 'boolean', 'label': 'Parking'},
                        {'name': 'pool', 'type': 'boolean', 'label': 'Pool'},
                        {'name': 'sea_view', 'type': 'boolean', 'label': 'Sea View'},
                        {'name': 'pet_friendly', 'type': 'boolean', 'label': 'Pet Friendly'},
                    ]
                }
            },
            {
                'name': 'Cars',
                'slug': 'cars',
                'description': 'Buy or rent vehicles across North Cyprus',
                'icon': 'car',
                'color': '#3B82F6',
                'is_bookable': True,
                'display_order': 2,
                'subcategories': [
                    {'name': 'For Sale', 'slug': 'sale'},
                    {'name': 'For Rent', 'slug': 'rent'},
                ],
                'schema': {
                    'fields': [
                        {'name': 'make', 'type': 'text', 'label': 'Make'},
                        {'name': 'model', 'type': 'text', 'label': 'Model'},
                        {'name': 'year', 'type': 'number', 'label': 'Year'},
                        {'name': 'mileage', 'type': 'number', 'label': 'Mileage (km)'},
                        {'name': 'transmission', 'type': 'select', 'label': 'Transmission', 'choices': ['automatic', 'manual']},
                        {'name': 'fuel_type', 'type': 'select', 'label': 'Fuel Type', 'choices': ['petrol', 'diesel', 'electric', 'hybrid']},
                    ]
                }
            },
            {
                'name': 'Marketplace',
                'slug': 'marketplace',
                'description': 'Buy and sell goods locally',
                'icon': 'shopping-bag',
                'color': '#F59E0B',
                'is_bookable': False,
                'display_order': 3,
                'subcategories': [
                    {'name': 'Electronics', 'slug': 'electronics'},
                    {'name': 'Home & Garden', 'slug': 'home-garden'},
                    {'name': 'Fashion', 'slug': 'fashion'},
                    {'name': 'Sports & Hobbies', 'slug': 'sports-hobbies'},
                ],
                'schema': {
                    'fields': [
                        {'name': 'condition', 'type': 'select', 'label': 'Condition', 'choices': ['new', 'like-new', 'good', 'fair']},
                        {'name': 'brand', 'type': 'text', 'label': 'Brand'},
                    ]
                }
            },
            {
                'name': 'Events',
                'slug': 'events',
                'description': 'Discover events and happenings',
                'icon': 'calendar',
                'color': '#EC4899',
                'is_bookable': True,
                'display_order': 4,
                'subcategories': [
                    {'name': 'Concerts & Shows', 'slug': 'concerts'},
                    {'name': 'Festivals', 'slug': 'festivals'},
                    {'name': 'Nightlife', 'slug': 'nightlife'},
                    {'name': 'Community', 'slug': 'community'},
                ],
                'schema': {
                    'fields': [
                        {'name': 'event_date', 'type': 'datetime', 'label': 'Event Date'},
                        {'name': 'venue', 'type': 'text', 'label': 'Venue'},
                        {'name': 'capacity', 'type': 'number', 'label': 'Capacity'},
                    ]
                }
            },
            {
                'name': 'Activities',
                'slug': 'activities',
                'description': 'Explore things to do in North Cyprus',
                'icon': 'compass',
                'color': '#8B5CF6',
                'is_bookable': True,
                'display_order': 5,
                'subcategories': [
                    {'name': 'Tours & Excursions', 'slug': 'tours'},
                    {'name': 'Dining', 'slug': 'dining'},
                    {'name': 'Water Sports', 'slug': 'water-sports'},
                    {'name': 'Cultural', 'slug': 'cultural'},
                ],
                'schema': {
                    'fields': [
                        {'name': 'duration', 'type': 'text', 'label': 'Duration'},
                        {'name': 'difficulty', 'type': 'select', 'label': 'Difficulty', 'choices': ['easy', 'moderate', 'challenging']},
                        {'name': 'group_size', 'type': 'number', 'label': 'Max Group Size'},
                    ]
                }
            },
            {
                'name': 'Services',
                'slug': 'services',
                'description': 'Professional services and help',
                'icon': 'wrench',
                'color': '#10B981',
                'is_bookable': True,
                'display_order': 6,
                'subcategories': [
                    {'name': 'Home Services', 'slug': 'home-services'},
                    {'name': 'Professional', 'slug': 'professional'},
                    {'name': 'Beauty & Wellness', 'slug': 'beauty-wellness'},
                    {'name': 'Tutoring', 'slug': 'tutoring'},
                ],
                'schema': {
                    'fields': [
                        {'name': 'hourly_rate', 'type': 'number', 'label': 'Hourly Rate'},
                        {'name': 'availability', 'type': 'text', 'label': 'Availability'},
                    ]
                }
            },
            {
                'name': 'Beaches',
                'slug': 'beaches',
                'description': 'Beach clubs and coastal experiences',
                'icon': 'umbrella',
                'color': '#06B6D4',
                'is_bookable': True,
                'display_order': 7,
                'subcategories': [
                    {'name': 'Public Beaches', 'slug': 'public'},
                    {'name': 'Beach Clubs', 'slug': 'clubs'},
                    {'name': 'Water Sports', 'slug': 'water-sports'},
                ],
                'schema': {
                    'fields': [
                        {'name': 'facilities', 'type': 'text', 'label': 'Facilities'},
                        {'name': 'entry_fee', 'type': 'number', 'label': 'Entry Fee'},
                    ]
                }
            },
            {
                'name': 'P2P',
                'slug': 'p2p',
                'description': 'Peer-to-peer sharing and community',
                'icon': 'users',
                'color': '#F97316',
                'is_bookable': False,
                'display_order': 8,
                'subcategories': [
                    {'name': 'Skills Exchange', 'slug': 'skills'},
                    {'name': 'Item Sharing', 'slug': 'item-sharing'},
                    {'name': 'Community', 'slug': 'community'},
                ],
                'schema': {
                    'fields': [
                        {'name': 'exchange_type', 'type': 'select', 'label': 'Exchange Type', 'choices': ['free', 'barter', 'paid']},
                    ]
                }
            },
        ]

        # Create categories and subcategories
        for cat_data in categories_data:
            subcats_data = cat_data.pop('subcategories')

            category, created = Category.objects.update_or_create(
                slug=cat_data['slug'],
                defaults={
                    **cat_data,
                    'is_featured_category': True,
                    'is_active': True,
                }
            )

            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{action} category: {category.name}'))

            # Create subcategories
            for i, subcat_data in enumerate(subcats_data):
                subcat, created = SubCategory.objects.update_or_create(
                    category=category,
                    slug=subcat_data['slug'],
                    defaults={
                        'name': subcat_data['name'],
                        'display_order': i,
                    }
                )
                action = 'Created' if created else 'Updated'
                self.stdout.write(f'  {action} subcategory: {subcat.name}')

        # Seed sample listings
        self.stdout.write(self.style.WARNING('\nSeeding sample listings...'))
        self._seed_properties(demo_user)
        self._seed_cars(demo_user)
        self._seed_marketplace(demo_user)
        self._seed_events(demo_user)
        self._seed_activities(demo_user)

        self.stdout.write(self.style.SUCCESS('\n✅ All done! Explore North Cyprus is ready.'))

    def _seed_properties(self, user):
        """Seed Properties listings"""
        category = Category.objects.get(slug='properties')
        subcategories = {sub.slug: sub for sub in category.subcategories.all()}

        locations = ['Kyrenia', 'Famagusta', 'Alsancak', 'Esentepe', 'Iskele', 'Catalkoy']

        properties_data = [
            # Daily Rentals
            {
                'title': 'Luxury Beachfront Villa',
                'description': 'Stunning 3-bedroom villa with private pool and direct beach access. Perfect for families.',
                'price': Decimal('150.00'),
                'currency': 'EUR',
                'location': 'Kyrenia',
                'subcategory': subcategories['daily-rental'],
                'transaction_type': 'rent_short',
                'is_featured': True,
                'dynamic_fields': {
                    'bedrooms': 3,
                    'bathrooms': 2,
                    'square_meters': 180,
                    'furnished': True,
                    'parking': True,
                    'pool': True,
                    'sea_view': True,
                    'pet_friendly': False,
                }
            },
            {
                'title': 'Cozy Studio Near EMU',
                'description': 'Modern studio apartment, walking distance to campus. Fully furnished.',
                'price': Decimal('40.00'),
                'currency': 'EUR',
                'location': 'Famagusta',
                'subcategory': subcategories['daily-rental'],
                'transaction_type': 'rent_short',
                'is_featured': False,
                'dynamic_fields': {
                    'bedrooms': 1,
                    'bathrooms': 1,
                    'square_meters': 35,
                    'furnished': True,
                    'parking': True,
                    'pool': False,
                    'sea_view': False,
                    'pet_friendly': True,
                }
            },
            # Long-term Rentals
            {
                'title': '2+1 Apartment in Alsancak',
                'description': 'Spacious 2-bedroom apartment with balcony. Quiet neighborhood, close to amenities.',
                'price': Decimal('850.00'),
                'currency': 'EUR',
                'location': 'Alsancak',
                'subcategory': subcategories['long-term'],
                'transaction_type': 'rent_long',
                'is_featured': True,
                'dynamic_fields': {
                    'bedrooms': 2,
                    'bathrooms': 1,
                    'square_meters': 95,
                    'furnished': False,
                    'parking': True,
                    'pool': False,
                    'sea_view': False,
                    'pet_friendly': True,
                }
            },
            {
                'title': 'Modern 3+1 with Pool',
                'description': 'Brand new apartment in gated community. Pool, gym, 24/7 security.',
                'price': Decimal('1200.00'),
                'currency': 'EUR',
                'location': 'Esentepe',
                'subcategory': subcategories['long-term'],
                'transaction_type': 'rent_long',
                'is_featured': True,
                'dynamic_fields': {
                    'bedrooms': 3,
                    'bathrooms': 2,
                    'square_meters': 140,
                    'furnished': True,
                    'parking': True,
                    'pool': True,
                    'sea_view': True,
                    'pet_friendly': False,
                }
            },
            # For Sale
            {
                'title': 'Sea View Penthouse',
                'description': 'Luxury penthouse with panoramic Mediterranean views. Rooftop terrace.',
                'price': Decimal('285000.00'),
                'currency': 'EUR',
                'location': 'Kyrenia',
                'subcategory': subcategories['sale'],
                'transaction_type': 'sale',
                'is_featured': True,
                'dynamic_fields': {
                    'bedrooms': 4,
                    'bathrooms': 3,
                    'square_meters': 220,
                    'furnished': True,
                    'parking': True,
                    'pool': True,
                    'sea_view': True,
                    'pet_friendly': True,
                }
            },
            {
                'title': 'Affordable 1+1 Investment',
                'description': 'Great investment opportunity. Ready title deed, near university.',
                'price': Decimal('65000.00'),
                'currency': 'EUR',
                'location': 'Famagusta',
                'subcategory': subcategories['sale'],
                'transaction_type': 'sale',
                'is_featured': False,
                'dynamic_fields': {
                    'bedrooms': 1,
                    'bathrooms': 1,
                    'square_meters': 55,
                    'furnished': False,
                    'parking': False,
                    'pool': True,
                    'sea_view': False,
                    'pet_friendly': True,
                }
            },
            # Projects
            {
                'title': 'Seaside Residence - Phase 2',
                'description': 'Off-plan luxury development. Completion Q4 2025. Payment plans available.',
                'price': Decimal('195000.00'),
                'currency': 'EUR',
                'location': 'Iskele',
                'subcategory': subcategories['projects'],
                'transaction_type': 'project',
                'is_featured': True,
                'dynamic_fields': {
                    'bedrooms': 2,
                    'bathrooms': 2,
                    'square_meters': 110,
                    'furnished': False,
                    'parking': True,
                    'pool': True,
                    'sea_view': True,
                    'pet_friendly': True,
                }
            },
        ]

        for prop_data in properties_data:
            listing, created = Listing.objects.get_or_create(
                title=prop_data['title'],
                owner=user,
                defaults={
                    **prop_data,
                    'category': category,
                    'status': 'active',
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created: {listing.title}')

    def _seed_cars(self, user):
        """Seed Cars listings"""
        category = Category.objects.get(slug='cars')
        subcategories = {sub.slug: sub for sub in category.subcategories.all()}

        cars_data = [
            # For Sale
            {
                'title': '2019 Toyota Corolla - Excellent Condition',
                'description': 'Well-maintained, single owner, full service history. Automatic, low mileage.',
                'price': Decimal('12500.00'),
                'currency': 'EUR',
                'location': 'Kyrenia',
                'subcategory': subcategories['sale'],
                'transaction_type': 'sale',
                'is_featured': True,
                'dynamic_fields': {
                    'make': 'Toyota',
                    'model': 'Corolla',
                    'year': 2019,
                    'mileage': 45000,
                    'transmission': 'automatic',
                    'fuel_type': 'hybrid',
                }
            },
            {
                'title': '2021 BMW 3 Series',
                'description': 'Like new, all options included. Leather seats, sunroof, navigation.',
                'price': Decimal('28000.00'),
                'currency': 'EUR',
                'location': 'Famagusta',
                'subcategory': subcategories['sale'],
                'transaction_type': 'sale',
                'is_featured': True,
                'dynamic_fields': {
                    'make': 'BMW',
                    'model': '3 Series',
                    'year': 2021,
                    'mileage': 18000,
                    'transmission': 'automatic',
                    'fuel_type': 'diesel',
                }
            },
            # For Rent
            {
                'title': 'Compact Car - Weekend Special',
                'description': 'Perfect for city driving. Free airport pickup/dropoff.',
                'price': Decimal('35.00'),
                'currency': 'EUR',
                'location': 'Kyrenia',
                'subcategory': subcategories['rent'],
                'transaction_type': 'rent_short',
                'is_featured': True,
                'dynamic_fields': {
                    'make': 'Hyundai',
                    'model': 'i20',
                    'year': 2022,
                    'mileage': 15000,
                    'transmission': 'automatic',
                    'fuel_type': 'petrol',
                }
            },
            {
                'title': 'SUV 7-Seater - Family Car',
                'description': 'Spacious SUV, perfect for family trips. Child seats available.',
                'price': Decimal('75.00'),
                'currency': 'EUR',
                'location': 'Famagusta',
                'subcategory': subcategories['rent'],
                'transaction_type': 'rent_short',
                'is_featured': False,
                'dynamic_fields': {
                    'make': 'Ford',
                    'model': 'Explorer',
                    'year': 2023,
                    'mileage': 8000,
                    'transmission': 'automatic',
                    'fuel_type': 'diesel',
                }
            },
        ]

        for car_data in cars_data:
            listing, created = Listing.objects.get_or_create(
                title=car_data['title'],
                owner=user,
                defaults={
                    **car_data,
                    'category': category,
                    'status': 'active',
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created: {listing.title}')

    def _seed_marketplace(self, user):
        """Seed Marketplace listings"""
        category = Category.objects.get(slug='marketplace')
        subcategories = {sub.slug: sub for sub in category.subcategories.all()}

        marketplace_data = [
            {
                'title': 'iPhone 14 Pro - Like New',
                'description': '256GB, unlocked, with original box and accessories. 6 months old.',
                'price': Decimal('750.00'),
                'currency': 'EUR',
                'location': 'Kyrenia',
                'subcategory': subcategories['electronics'],
                'transaction_type': 'sale',
                'is_featured': True,
                'dynamic_fields': {
                    'condition': 'like-new',
                    'brand': 'Apple',
                }
            },
            {
                'title': 'Garden Furniture Set',
                'description': 'Complete patio set: table, 6 chairs, umbrella. Weather-resistant.',
                'price': Decimal('350.00'),
                'currency': 'EUR',
                'location': 'Alsancak',
                'subcategory': subcategories['home-garden'],
                'transaction_type': 'sale',
                'is_featured': False,
                'dynamic_fields': {
                    'condition': 'good',
                    'brand': 'N/A',
                }
            },
            {
                'title': 'Designer Handbag Collection',
                'description': 'Authentic designer bags. Various styles and colors available.',
                'price': Decimal('120.00'),
                'currency': 'EUR',
                'location': 'Famagusta',
                'subcategory': subcategories['fashion'],
                'transaction_type': 'sale',
                'is_featured': True,
                'dynamic_fields': {
                    'condition': 'new',
                    'brand': 'Various',
                }
            },
            {
                'title': 'Mountain Bike - Trek X-Caliber',
                'description': 'Professional mountain bike, well maintained. Includes helmet and accessories.',
                'price': Decimal('450.00'),
                'currency': 'EUR',
                'location': 'Kyrenia',
                'subcategory': subcategories['sports-hobbies'],
                'transaction_type': 'sale',
                'is_featured': False,
                'dynamic_fields': {
                    'condition': 'good',
                    'brand': 'Trek',
                }
            },
        ]

        for item_data in marketplace_data:
            listing, created = Listing.objects.get_or_create(
                title=item_data['title'],
                owner=user,
                defaults={
                    **item_data,
                    'category': category,
                    'status': 'active',
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created: {listing.title}')

    def _seed_events(self, user):
        """Seed Events listings"""
        category = Category.objects.get(slug='events')
        subcategories = {sub.slug: sub for sub in category.subcategories.all()}

        from datetime import datetime, timedelta
        today = datetime.now()

        events_data = [
            {
                'title': 'Live Jazz Night at Harbor',
                'description': 'International jazz quartet performing classic and contemporary pieces.',
                'price': Decimal('25.00'),
                'currency': 'EUR',
                'location': 'Kyrenia Harbor',
                'subcategory': subcategories['concerts'],
                'transaction_type': 'booking',
                'is_featured': True,
                'dynamic_fields': {
                    'event_date': (today + timedelta(days=7)).isoformat(),
                    'venue': 'Harbor Jazz Club',
                    'capacity': 120,
                }
            },
            {
                'title': 'Olive Festival 2025',
                'description': 'Annual celebration of olive harvest. Food, music, and family activities.',
                'price': Decimal('0.00'),
                'currency': 'EUR',
                'location': 'Zeytinlik',
                'subcategory': subcategories['festivals'],
                'transaction_type': 'booking',
                'is_featured': True,
                'dynamic_fields': {
                    'event_date': (today + timedelta(days=30)).isoformat(),
                    'venue': 'Zeytinlik Olive Groves',
                    'capacity': 500,
                }
            },
            {
                'title': 'Rooftop Sunset Party',
                'description': 'DJ sets, cocktails, and stunning sunset views every Friday.',
                'price': Decimal('15.00'),
                'currency': 'EUR',
                'location': 'Kyrenia',
                'subcategory': subcategories['nightlife'],
                'transaction_type': 'booking',
                'is_featured': False,
                'dynamic_fields': {
                    'event_date': (today + timedelta(days=5)).isoformat(),
                    'venue': 'Sky Lounge',
                    'capacity': 200,
                }
            },
        ]

        for event_data in events_data:
            listing, created = Listing.objects.get_or_create(
                title=event_data['title'],
                owner=user,
                defaults={
                    **event_data,
                    'category': category,
                    'status': 'active',
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created: {listing.title}')

    def _seed_activities(self, user):
        """Seed Activities listings"""
        category = Category.objects.get(slug='activities')
        subcategories = {sub.slug: sub for sub in category.subcategories.all()}

        activities_data = [
            {
                'title': 'Karpaz Peninsula Day Tour',
                'description': 'Explore the wild beauty of Karpaz. Visit golden beaches, wild donkeys, and ancient churches.',
                'price': Decimal('65.00'),
                'currency': 'EUR',
                'location': 'Karpaz',
                'subcategory': subcategories['tours'],
                'transaction_type': 'booking',
                'is_featured': True,
                'dynamic_fields': {
                    'duration': '8 hours',
                    'difficulty': 'easy',
                    'group_size': 15,
                }
            },
            {
                'title': 'Harbor Meze Tasting Experience',
                'description': 'Authentic Cypriot meze at a traditional restaurant. 20+ dishes included.',
                'price': Decimal('45.00'),
                'currency': 'EUR',
                'location': 'Kyrenia Harbor',
                'subcategory': subcategories['dining'],
                'transaction_type': 'booking',
                'is_featured': True,
                'dynamic_fields': {
                    'duration': '2 hours',
                    'difficulty': 'easy',
                    'group_size': 8,
                }
            },
            {
                'title': 'Scuba Diving - Beginner Course',
                'description': 'PADI certified instructors. All equipment included. Discover the underwater world.',
                'price': Decimal('95.00'),
                'currency': 'EUR',
                'location': 'Alagadi',
                'subcategory': subcategories['water-sports'],
                'transaction_type': 'booking',
                'is_featured': False,
                'dynamic_fields': {
                    'duration': '3 hours',
                    'difficulty': 'moderate',
                    'group_size': 6,
                }
            },
            {
                'title': 'Kyrenia Castle & Shipwreck Museum',
                'description': 'Guided tour of historic castle and world\'s oldest shipwreck.',
                'price': Decimal('20.00'),
                'currency': 'EUR',
                'location': 'Kyrenia',
                'subcategory': subcategories['cultural'],
                'transaction_type': 'booking',
                'is_featured': True,
                'dynamic_fields': {
                    'duration': '2 hours',
                    'difficulty': 'easy',
                    'group_size': 20,
                }
            },
        ]

        for activity_data in activities_data:
            listing, created = Listing.objects.get_or_create(
                title=activity_data['title'],
                owner=user,
                defaults={
                    **activity_data,
                    'category': category,
                    'status': 'active',
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created: {listing.title}')
