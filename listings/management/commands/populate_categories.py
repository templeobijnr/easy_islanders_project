"""
Management command to populate the canonical categories and subcategories
for Easy Islanders marketplace.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from listings.models import Category, SubCategory


class Command(BaseCommand):
    help = 'Populate the database with canonical categories and subcategories'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting category population...')
        
        # Define the canonical categories and their subcategories
        categories_data = {
            'accommodation': {
                'name': 'Accommodation / Real Estate',
                'icon': 'Home',
                'description': 'Properties for rent or sale',
                'display_order': 1,
                'subcategories': [
                    'Apartments',
                    'Villas',
                    'Bungalows',
                    'Houses',
                    'Guesthouses',
                    'Hostels',
                    'Hotels',
                    'Rooms / Shared Spaces',
                    'Commercial Spaces',
                    'Land / Plots',
                ]
            },
            'products': {
                'name': 'Products',
                'icon': 'ShoppingBag',
                'description': 'Various products for sale',
                'display_order': 2,
                'subcategories': {
                    'Electronics': [
                        'Phones',
                        'Laptops',
                        'Tablets',
                        'Cameras',
                        'Audio / Speakers',
                        'Gaming Consoles',
                        'Accessories',
                    ],
                    'Fashion': [
                        "Men's Clothing",
                        "Women's Clothing",
                        'Kids Clothing',
                        'Shoes',
                        'Jewelry & Watches',
                        'Bags & Accessories',
                    ],
                    'Beauty & Personal Care': [
                        'Hair Products',
                        'Skin Care',
                        'Makeup',
                        'Fragrances',
                    ],
                    'Home & Living': [
                        'Furniture',
                        'Home Appliances',
                        'Kitchenware',
                        'Decor',
                    ],
                    'Sports & Fitness': [
                        'Equipment',
                        'Apparel',
                        'Supplements',
                    ],
                    'Health & Wellness': [
                        'Medical Devices',
                        'Supplements',
                        'Hygiene Products',
                    ],
                    'Private / Miscellaneous': [
                        'Adult Products',
                        'Personal Items',
                    ],
                }
            },
            'vehicles': {
                'name': 'Vehicles',
                'icon': 'Car',
                'description': 'Cars, bikes, and other vehicles',
                'display_order': 3,
                'subcategories': {
                    'Cars': [
                        'Sedans',
                        'SUVs',
                        'Trucks',
                        'Vans',
                    ],
                    'Other Vehicles': [
                        'Motorbikes / Scooters',
                        'Boats / Jet Skis',
                        'Bicycles',
                        'Vehicle Parts & Accessories',
                    ]
                }
            },
            'local_businesses': {
                'name': 'Local Businesses',
                'icon': 'Building2',
                'description': 'Local businesses and establishments',
                'display_order': 4,
                'subcategories': [
                    'Restaurants',
                    'Cafes',
                    'Bars / Lounges',
                    'Shops / Boutiques',
                    'Salons / Barbers',
                    'Spas / Wellness Centers',
                    'Gyms / Fitness Centers',
                    'Clinics / Health Centers',
                    'Grocery Stores',
                    'Pharmacies',
                ]
            },
            'services': {
                'name': 'Services',
                'icon': 'Briefcase',
                'description': 'Professional and personal services',
                'display_order': 5,
                'subcategories': [
                    'Cleaning',
                    'Maintenance / Repairs',
                    'Delivery / Logistics',
                    'Photography / Videography',
                    'Event Planning',
                    'Tutoring / Education',
                    'Digital Marketing',
                    'Web Development / IT',
                    'Freelance / Consulting',
                    'Legal / Financial Services',
                    'Transportation / Taxi / Rentals',
                ]
            },
            'experiences': {
                'name': 'Experiences & Entertainment',
                'icon': 'Camera',
                'description': 'Tours, events, and entertainment',
                'display_order': 6,
                'subcategories': [
                    'Tours',
                    'Excursions',
                    'Water Sports',
                    'Cultural Events',
                    'Workshops',
                    'Nightlife / Parties',
                    'Art & Music',
                ]
            },
            'jobs': {
                'name': 'Jobs & Gigs',
                'icon': 'Briefcase',
                'description': 'Employment opportunities',
                'display_order': 7,
                'subcategories': [
                    'Full-time Jobs',
                    'Part-time Jobs',
                    'Remote Work',
                    'Freelance Gigs',
                ]
            },
            'miscellaneous': {
                'name': 'Miscellaneous',
                'icon': 'Package',
                'description': 'Other listings',
                'display_order': 8,
                'subcategories': [
                    'Lost & Found',
                    'Community Posts',
                    'Donations / Giveaways',
                ]
            },
        }

        with transaction.atomic():
            # Track statistics
            categories_created = 0
            categories_updated = 0
            subcategories_created = 0
            subcategories_updated = 0

            for cat_slug, cat_data in categories_data.items():
                # Create or update category
                category, created = Category.objects.update_or_create(
                    slug=cat_slug,
                    defaults={
                        'name': cat_data['name'],
                        # 'icon': cat_data.get('icon', ''),  # Commented out until migration is applied
                        # 'description': cat_data.get('description', ''),  # Commented out until migration is applied
                        'display_order': cat_data.get('display_order', 999),
                    }
                )
                
                if created:
                    categories_created += 1
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Created category: {category.name}'))
                else:
                    categories_updated += 1
                    self.stdout.write(self.style.WARNING(f'  ↻ Updated category: {category.name}'))

                # Handle subcategories
                subcategories = cat_data.get('subcategories', [])
                
                # Check if subcategories is a dict (nested structure) or list
                if isinstance(subcategories, dict):
                    # Flatten nested subcategories (for Products and Vehicles)
                    all_subcategories = []
                    for parent_subcat, child_subcats in subcategories.items():
                        # Add the parent as a subcategory
                        all_subcategories.append(parent_subcat)
                        # Add all children as subcategories
                        if isinstance(child_subcats, list):
                            all_subcategories.extend(child_subcats)
                    subcategories = all_subcategories

                # Create subcategories
                for idx, subcat_name in enumerate(subcategories):
                    # Generate slug from name
                    subcat_slug = subcat_name.lower().replace(' ', '_').replace('/', '_').replace('&', 'and')
                    
                    subcategory, sub_created = SubCategory.objects.update_or_create(
                        category=category,
                        slug=subcat_slug,
                        defaults={
                            'name': subcat_name,
                            'display_order': idx,
                        }
                    )
                    
                    if sub_created:
                        subcategories_created += 1
                        self.stdout.write(f'    + {subcat_name}')
                    else:
                        subcategories_updated += 1

            # Print summary
            self.stdout.write('\n' + '='*50)
            self.stdout.write(self.style.SUCCESS('Category population complete!'))
            self.stdout.write(f'Categories created: {categories_created}')
            self.stdout.write(f'Categories updated: {categories_updated}')
            self.stdout.write(f'Subcategories created: {subcategories_created}')
            self.stdout.write(f'Subcategories updated: {subcategories_updated}')
            self.stdout.write(f'Total categories: {Category.objects.count()}')
            self.stdout.write(f'Total subcategories: {SubCategory.objects.count()}')
