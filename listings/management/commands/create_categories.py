from django.core.management.base import BaseCommand
from listings.models import Category, SubCategory


class Command(BaseCommand):
    help = 'Create all categories and subcategories for the marketplace'

    def handle(self, *args, **options):
        categories_data = [
            {
                'name': 'Real Estate',
                'slug': 'real_estate',
                'description': 'Properties, houses, apartments, villas, hotels',
                'is_bookable': True,
                'icon': 'Home',
                'color': '#3B82F6',
                'subcategories': [
                    {'name': 'Apartments', 'slug': 'apartments'},
                    {'name': 'Houses', 'slug': 'houses'},
                    {'name': 'Villas', 'slug': 'villas'},
                    {'name': 'Hotels', 'slug': 'hotels'},
                    {'name': 'Commercial', 'slug': 'commercial'},
                ]
            },
            {
                'name': 'Events',
                'slug': 'events',
                'description': 'Concerts, workshops, conferences, parties',
                'is_bookable': True,
                'icon': 'Calendar',
                'color': '#A855F7',
                'subcategories': [
                    {'name': 'Concerts', 'slug': 'concerts'},
                    {'name': 'Workshops', 'slug': 'workshops'},
                    {'name': 'Conferences', 'slug': 'conferences'},
                    {'name': 'Parties', 'slug': 'parties'},
                    {'name': 'Sports', 'slug': 'sports'},
                ]
            },
            {
                'name': 'Activities',
                'slug': 'activities',
                'description': 'Experiences and tours - sailing, diving, dance classes',
                'is_bookable': True,
                'icon': 'Zap',
                'color': '#10B981',
                'subcategories': [
                    {'name': 'Tours', 'slug': 'tours'},
                    {'name': 'Water Sports', 'slug': 'water_sports'},
                    {'name': 'Classes', 'slug': 'classes'},
                    {'name': 'Adventures', 'slug': 'adventures'},
                    {'name': 'Experiences', 'slug': 'experiences'},
                ]
            },
            {
                'name': 'Appointments',
                'slug': 'appointments',
                'description': 'Salon, spa, professional services',
                'is_bookable': True,
                'icon': 'Users',
                'color': '#EC4899',
                'subcategories': [
                    {'name': 'Hair Salon', 'slug': 'hair_salon'},
                    {'name': 'Spa', 'slug': 'spa'},
                    {'name': 'Medical', 'slug': 'medical'},
                    {'name': 'Fitness', 'slug': 'fitness'},
                    {'name': 'Consulting', 'slug': 'consulting'},
                ]
            },
            {
                'name': 'Vehicles',
                'slug': 'vehicles',
                'description': 'Cars, scooters, boats for sale or rent',
                'is_bookable': True,
                'icon': 'Briefcase',
                'color': '#F97316',
                'subcategories': [
                    {'name': 'Cars', 'slug': 'cars'},
                    {'name': 'Scooters', 'slug': 'scooters'},
                    {'name': 'Boats', 'slug': 'boats'},
                    {'name': 'Motorcycles', 'slug': 'motorcycles'},
                    {'name': 'Trucks', 'slug': 'trucks'},
                ]
            },
            {
                'name': 'Products',
                'slug': 'products',
                'description': 'Electronics, furniture, clothing, household goods',
                'is_bookable': False,
                'icon': 'Package',
                'color': '#FBBF24',
                'subcategories': [
                    {'name': 'Electronics', 'slug': 'electronics'},
                    {'name': 'Furniture', 'slug': 'furniture'},
                    {'name': 'Clothing', 'slug': 'clothing'},
                    {'name': 'Household', 'slug': 'household'},
                    {'name': 'Books', 'slug': 'books'},
                ]
            },
            {
                'name': 'Services',
                'slug': 'services',
                'description': 'Plumber, lawyer, cleaner, repair services',
                'is_bookable': True,
                'icon': 'Wrench',
                'color': '#6366F1',
                'subcategories': [
                    {'name': 'Plumbing', 'slug': 'plumbing'},
                    {'name': 'Electrical', 'slug': 'electrical'},
                    {'name': 'Cleaning', 'slug': 'cleaning'},
                    {'name': 'Legal', 'slug': 'legal'},
                    {'name': 'Repair', 'slug': 'repair'},
                ]
            },
            {
                'name': 'Restaurants',
                'slug': 'restaurants',
                'description': 'Restaurants, bars, cafes',
                'is_bookable': True,
                'icon': 'UtensilsCrossed',
                'color': '#EF4444',
                'subcategories': [
                    {'name': 'Restaurants', 'slug': 'restaurants'},
                    {'name': 'Bars', 'slug': 'bars'},
                    {'name': 'Cafes', 'slug': 'cafes'},
                    {'name': 'Fast Food', 'slug': 'fast_food'},
                    {'name': 'Desserts', 'slug': 'desserts'},
                ]
            },
            {
                'name': 'P2P',
                'slug': 'p2p',
                'description': 'Peer-to-peer services and exchanges',
                'is_bookable': True,
                'icon': 'Share2',
                'color': '#14B8A6',
                'subcategories': [
                    {'name': 'Item Exchange', 'slug': 'item_exchange'},
                    {'name': 'Service Exchange', 'slug': 'service_exchange'},
                    {'name': 'Skill Exchange', 'slug': 'skill_exchange'},
                    {'name': 'Time Exchange', 'slug': 'time_exchange'},
                    {'name': 'Mixed Exchange', 'slug': 'mixed_exchange'},
                ]
            },
        ]

        for cat_data in categories_data:
            subcats = cat_data.pop('subcategories', [])
            
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'→ Category already exists: {category.name}')
                )
            
            # Create subcategories
            for subcat_data in subcats:
                subcat, sub_created = SubCategory.objects.get_or_create(
                    category=category,
                    slug=subcat_data['slug'],
                    defaults={'name': subcat_data['name']}
                )
                
                if sub_created:
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ Created subcategory: {subcat.name}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'  → Subcategory already exists: {subcat.name}')
                    )

        self.stdout.write(
            self.style.SUCCESS('\n✅ All categories and subcategories created successfully!')
        )
