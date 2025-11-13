#!/usr/bin/env python3
"""
Comprehensive category population script for Easy Islanders marketplace
Creates all major categories and subcategories with proper schemas
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')
sys.path.append('/Users/apple_trnc/Desktop/work/easy_islanders_project')
django.setup()

from listings.models import Category, SubCategory

# Comprehensive category data with schemas
CATEGORIES_DATA = [
    {
        'name': 'Real Estate',
        'slug': 'real-estate',
        'description': 'Properties, rentals and real estate listings',
        'is_bookable': True,
        'is_active': True,
        'is_featured_category': True,
        'display_order': 1,
        'icon': 'Home',
        'color': '#6CC24A',
        'schema': {
            'fields': [
                {'name': 'property_type', 'type': 'select', 'label': 'Property Type', 
                 'choices': ['apartment', 'house', 'villa', 'commercial', 'studio', 'penthouse'], 'required': True},
                {'name': 'bedrooms', 'type': 'number', 'label': 'Bedrooms', 'min': 0, 'max': 10, 'required': True},
                {'name': 'bathrooms', 'type': 'number', 'label': 'Bathrooms', 'min': 0, 'max': 10, 'required': True},
                {'name': 'area_sqm', 'type': 'number', 'label': 'Area (sqm)', 'min': 0, 'required': False},
                {'name': 'furnished', 'type': 'boolean', 'label': 'Furnished', 'required': False},
                {'name': 'parking', 'type': 'boolean', 'label': 'Parking Available', 'required': False},
                {'name': 'rental_type', 'type': 'select', 'label': 'Rental Type', 
                 'choices': ['short_term', 'long_term', 'sale'], 'required': True},
                {'name': 'year_built', 'type': 'number', 'label': 'Year Built', 'min': 1900, 'required': False},
                {'name': 'amenities', 'type': 'multi_select', 'label': 'Amenities', 
                 'choices': ['Wi-Fi', 'Pool', 'Gym', 'Security', 'Garden', 'Balcony', 'Air Conditioning'], 'required': False}
            ]
        },
        'subcategories': [
            'Apartments', 'Houses', 'Villas', 'Commercial Properties', 
            'Studio Apartments', 'Penthouses', 'Land', 'Holiday Homes'
        ]
    },
    {
        'name': 'Electronics',
        'slug': 'electronics',
        'description': 'Electronic devices, gadgets and appliances',
        'is_bookable': False,
        'is_active': True,
        'is_featured_category': True,
        'display_order': 2,
        'icon': 'Zap',
        'color': '#95E1D3',
        'schema': {
            'fields': [
                {'name': 'brand', 'type': 'text', 'label': 'Brand', 'required': True},
                {'name': 'model', 'type': 'text', 'label': 'Model', 'required': True},
                {'name': 'condition', 'type': 'select', 'label': 'Condition', 
                 'choices': ['new', 'used', 'refurbished'], 'required': True},
                {'name': 'warranty', 'type': 'boolean', 'label': 'Has Warranty', 'required': False},
                {'name': 'original_box', 'type': 'boolean', 'label': 'Original Box', 'required': False},
                {'name': 'year_manufactured', 'type': 'number', 'label': 'Year Manufactured', 'min': 2000, 'required': False}
            ]
        },
        'subcategories': [
            'Mobile Phones', 'Laptops', 'Tablets', 'Cameras', 'Audio Equipment', 
            'Gaming Consoles', 'Smart Watches', 'TVs & Home Theater', 'Appliances'
        ]
    },
    {
        'name': 'Vehicles',
        'slug': 'vehicles',
        'description': 'Cars, motorcycles, boats and other vehicles',
        'is_bookable': False,
        'is_active': True,
        'is_featured_category': True,
        'display_order': 3,
        'icon': 'Car',
        'color': '#F38181',
        'schema': {
            'fields': [
                {'name': 'make', 'type': 'text', 'label': 'Make', 'required': True},
                {'name': 'model', 'type': 'text', 'label': 'Model', 'required': True},
                {'name': 'year', 'type': 'number', 'label': 'Year', 'min': 1900, 'max': 2025, 'required': True},
                {'name': 'mileage_km', 'type': 'number', 'label': 'Mileage (km)', 'min': 0, 'required': False},
                {'name': 'transmission', 'type': 'select', 'label': 'Transmission', 
                 'choices': ['manual', 'automatic', 'cvt'], 'required': True},
                {'name': 'fuel_type', 'type': 'select', 'label': 'Fuel Type', 
                 'choices': ['petrol', 'diesel', 'electric', 'hybrid', 'lpg'], 'required': True},
                {'name': 'condition', 'type': 'select', 'label': 'Condition', 
                 'choices': ['new', 'used', 'certified_preowned'], 'required': True}
            ]
        },
        'subcategories': [
            'Cars', 'Motorcycles', 'Scooters', 'Trucks', 'Boats', 
            'RVs & Campers', 'Bicycles', 'Electric Vehicles'
        ]
    },
    {
        'name': 'Services',
        'slug': 'services',
        'description': 'Professional services and consulting',
        'is_bookable': True,
        'is_active': True,
        'is_featured_category': True,
        'display_order': 4,
        'icon': 'Wrench',
        'color': '#AA96DA',
        'schema': {
            'fields': [
                {'name': 'service_type', 'type': 'select', 'label': 'Service Type', 
                 'choices': ['consulting', 'repair', 'cleaning', 'tutoring', 'photography', 'legal', 'accounting'], 'required': True},
                {'name': 'experience_years', 'type': 'number', 'label': 'Years of Experience', 'min': 0, 'required': False},
                {'name': 'certifications', 'type': 'text', 'label': 'Certifications', 'required': False},
                {'name': 'service_area', 'type': 'text', 'label': 'Service Area', 'required': False},
                {'name': 'hourly_rate', 'type': 'number', 'label': 'Hourly Rate', 'min': 0, 'required': False},
                {'name': 'onsite_service', 'type': 'boolean', 'label': 'On-site Service Available', 'required': False}
            ]
        },
        'subcategories': [
            'IT Support', 'Home Repair', 'Cleaning Services', 'Legal Services', 
            'Accounting', 'Tutoring', 'Photography', 'Web Design', 'Consulting'
        ]
    },
    {
        'name': 'Activities & Tours',
        'slug': 'activities-tours',
        'description': 'Tours, experiences and recreational activities',
        'is_bookable': True,
        'is_active': True,
        'is_featured_category': True,
        'display_order': 5,
        'icon': 'Map',
        'color': '#FCBAD3',
        'schema': {
            'fields': [
                {'name': 'activity_type', 'type': 'select', 'label': 'Activity Type', 
                 'choices': ['tour', 'adventure', 'cultural', 'water_sports', 'wildlife', 'food_experience'], 'required': True},
                {'name': 'duration_hours', 'type': 'number', 'label': 'Duration (hours)', 'min': 0.5, 'max': 24, 'required': True},
                {'name': 'group_size', 'type': 'number', 'label': 'Max Group Size', 'min': 1, 'max': 50, 'required': False},
                {'name': 'difficulty_level', 'type': 'select', 'label': 'Difficulty Level', 
                 'choices': ['easy', 'moderate', 'challenging'], 'required': False},
                {'name': 'equipment_provided', 'type': 'boolean', 'label': 'Equipment Provided', 'required': False},
                {'name': 'age_restriction', 'type': 'number', 'label': 'Minimum Age', 'min': 0, 'required': False}
            ]
        },
        'subcategories': [
            'City Tours', 'Adventure Sports', 'Cultural Tours', 'Water Activities', 
            'Wildlife Tours', 'Food Tours', 'Hiking', 'Scuba Diving', 'Boat Tours'
        ]
    },
    {
        'name': 'Events & Entertainment',
        'slug': 'events-entertainment',
        'description': 'Events, parties and entertainment services',
        'is_bookable': True,
        'is_active': True,
        'is_featured_category': False,
        'display_order': 6,
        'icon': 'Music',
        'color': '#FFFFD2',
        'schema': {
            'fields': [
                {'name': 'event_type', 'type': 'select', 'label': 'Event Type', 
                 'choices': ['concert', 'festival', 'conference', 'workshop', 'party', 'exhibition'], 'required': True},
                {'name': 'capacity', 'type': 'number', 'label': 'Capacity', 'min': 1, 'required': True},
                {'name': 'duration_hours', 'type': 'number', 'label': 'Duration (hours)', 'min': 1, 'required': True},
                {'name': 'catering_included', 'type': 'boolean', 'label': 'Catering Included', 'required': False},
                {'name': 'venue_type', 'type': 'select', 'label': 'Venue Type', 
                 'choices': ['indoor', 'outdoor', 'hybrid'], 'required': False}
            ]
        },
        'subcategories': [
            'Concerts', 'Festivals', 'Conferences', 'Workshops', 
            'Private Parties', 'Weddings', 'Corporate Events', 'Exhibitions'
        ]
    },
    {
        'name': 'Fashion & Accessories',
        'slug': 'fashion-accessories',
        'description': 'Clothing, shoes and fashion accessories',
        'is_bookable': False,
        'is_active': True,
        'is_featured_category': False,
        'display_order': 7,
        'icon': 'ShoppingBag',
        'color': '#A8E6CF',
        'schema': {
            'fields': [
                {'name': 'brand', 'type': 'text', 'label': 'Brand', 'required': False},
                {'name': 'size', 'type': 'text', 'label': 'Size', 'required': True},
                {'name': 'condition', 'type': 'select', 'label': 'Condition', 
                 'choices': ['new', 'like_new', 'good', 'fair'], 'required': True},
                {'name': 'color', 'type': 'text', 'label': 'Color', 'required': False},
                {'name': 'material', 'type': 'text', 'label': 'Material', 'required': False},
                {'name': 'season', 'type': 'select', 'label': 'Season', 
                 'choices': ['spring', 'summer', 'fall', 'winter', 'all_season'], 'required': False}
            ]
        },
        'subcategories': [
            "Women's Clothing", "Men's Clothing", "Shoes", "Handbags", 
            "Jewelry", "Watches", "Accessories", "Sportswear"
        ]
    },
    {
        'name': 'Home & Garden',
        'slug': 'home-garden',
        'description': 'Furniture, home decor and garden items',
        'is_bookable': False,
        'is_active': True,
        'is_featured_category': False,
        'display_order': 8,
        'icon': 'Home',
        'color': '#C7CEEA',
        'schema': {
            'fields': [
                {'name': 'condition', 'type': 'select', 'label': 'Condition', 
                 'choices': ['new', 'like_new', 'good', 'needs_repair'], 'required': True},
                {'name': 'material', 'type': 'text', 'label': 'Material', 'required': False},
                {'name': 'color', 'type': 'text', 'label': 'Color', 'required': False},
                {'name': 'assembly_required', 'type': 'boolean', 'label': 'Assembly Required', 'required': False},
                {'name': 'dimensions', 'type': 'text', 'label': 'Dimensions (LxWxH)', 'required': False}
            ]
        },
        'subcategories': [
            'Furniture', 'Home Decor', 'Kitchen Appliances', 'Garden Tools', 
            'Lighting', 'Rugs & Carpets', 'Storage', 'Outdoor Furniture'
        ]
    },
    {
        'name': 'Sports & Fitness',
        'slug': 'sports-fitness',
        'description': 'Sports equipment and fitness accessories',
        'is_bookable': False,
        'is_active': True,
        'is_featured_category': False,
        'display_order': 9,
        'icon': 'Activity',
        'color': '#FFDAC1',
        'schema': {
            'fields': [
                {'name': 'sport_type', 'type': 'select', 'label': 'Sport Type', 
                 'choices': ['gym', 'running', 'cycling', 'team_sports', 'water_sports', 'winter_sports'], 'required': True},
                {'name': 'condition', 'type': 'select', 'label': 'Condition', 
                 'choices': ['new', 'like_new', 'good'], 'required': True},
                {'name': 'brand', 'type': 'text', 'label': 'Brand', 'required': False},
                {'name': 'size', 'type': 'text', 'label': 'Size', 'required': False}
            ]
        },
        'subcategories': [
            'Gym Equipment', 'Running Gear', 'Cycling Equipment', 'Team Sports', 
            'Water Sports', 'Winter Sports', 'Yoga & Pilates', 'Fitness Accessories'
        ]
    },
    {
        'name': 'Books & Media',
        'slug': 'books-media',
        'description': 'Books, movies, music and educational materials',
        'is_bookable': False,
        'is_active': True,
        'is_featured_category': False,
        'display_order': 10,
        'icon': 'Book',
        'color': '#E2F0CB',
        'schema': {
            'fields': [
                {'name': 'media_type', 'type': 'select', 'label': 'Media Type', 
                 'choices': ['book', 'ebook', 'audiobook', 'dvd', 'cd', 'vinyl'], 'required': True},
                {'name': 'genre', 'type': 'text', 'label': 'Genre', 'required': False},
                {'name': 'condition', 'type': 'select', 'label': 'Condition', 
                 'choices': ['new', 'like_new', 'good', 'acceptable'], 'required': True},
                {'name': 'language', 'type': 'text', 'label': 'Language', 'required': False},
                {'name': 'author_artist', 'type': 'text', 'label': 'Author/Artist', 'required': False}
            ]
        },
        'subcategories': [
            'Fiction Books', 'Non-Fiction Books', 'Textbooks', 'Movies & TV', 
            'Music', 'Video Games', 'Audiobooks', 'Educational Materials'
        ]
    },
    {
        'name': 'Business & Industrial',
        'slug': 'business-industrial',
        'description': 'Business equipment and industrial supplies',
        'is_bookable': False,
        'is_active': True,
        'is_featured_category': False,
        'display_order': 11,
        'icon': 'Briefcase',
        'color': '#B5EAD7',
        'schema': {
            'fields': [
                {'name': 'equipment_type', 'type': 'select', 'label': 'Equipment Type', 
                 'choices': ['office', 'manufacturing', 'construction', 'medical', 'restaurant'], 'required': True},
                {'name': 'condition', 'type': 'select', 'label': 'Condition', 
                 'choices': ['new', 'refurbished', 'used'], 'required': True},
                {'name': 'brand', 'type': 'text', 'label': 'Brand', 'required': False},
                {'name': 'power_requirements', 'type': 'text', 'label': 'Power Requirements', 'required': False}
            ]
        },
        'subcategories': [
            'Office Equipment', 'Manufacturing Equipment', 'Construction Tools', 
            'Medical Equipment', 'Restaurant Equipment', 'Industrial Supplies'
        ]
    }
]

def populate_categories():
    """Populate the database with comprehensive categories and subcategories"""
    print("🚀 Starting comprehensive category population...")
    
    categories_created = 0
    subcategories_created = 0
    
    for cat_data in CATEGORIES_DATA:
        subcats = cat_data.pop('subcategories', [])
        
        # Create or update category
        category, created = Category.objects.update_or_create(
            slug=cat_data['slug'],
            defaults=cat_data
        )
        
        if created:
            categories_created += 1
            print(f"✅ Created category: {category.name}")
        else:
            print(f"🔄 Updated category: {category.name}")
        
        # Create subcategories
        for i, subcat_name in enumerate(subcats):
            subcat_slug = subcat_name.lower().replace(' ', '-').replace('/', '-').replace('&', 'and')
            
            try:
                subcategory, sub_created = SubCategory.objects.update_or_create(
                    category=category,
                    slug=subcat_slug,
                    defaults={
                        'name': subcat_name,
                        'display_order': i,
                        'description': f"{subcat_name} in {category.name}"
                    }
                )
                
                if sub_created:
                    subcategories_created += 1
                    print(f"  ✅ Created subcategory: {subcategory.name}")
                else:
                    print(f"  🔄 Updated subcategory: {subcategory.name}")
                    
            except Exception as e:
                print(f"  ❌ Error creating subcategory {subcat_name}: {e}")
    
    print(f"\n📊 Population Summary:")
    print(f"  Categories created: {categories_created}")
    print(f"  Subcategories created: {subcategories_created}")
    print(f"  Total categories: {Category.objects.count()}")
    print(f"  Total subcategories: {SubCategory.objects.count()}")
    
    print(f"\n🎉 Category population complete!")

if __name__ == '__main__':
    populate_categories()
