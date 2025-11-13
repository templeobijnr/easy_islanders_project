"""
Management command to seed initial booking types for Easy Islanders.

Usage:
    python manage.py seed_booking_types
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from bookings.models import BookingType


class Command(BaseCommand):
    help = 'Seed initial booking types for the Easy Islanders booking system'

    def handle(self, *args, **options):
        booking_types = [
            {
                'name': 'Apartment Rental',
                'slug': 'apartment-rental',
                'description': 'Short-term apartment and property rentals',
                'icon': 'Home',
                'color': '#6CC24A',
                'requires_dates': True,
                'requires_time_slot': False,
                'requires_guests': True,
                'requires_vehicle_info': False,
                'schema': {
                    'fields': [
                        {'name': 'number_of_guests', 'type': 'number', 'label': 'Number of Guests', 'required': True},
                        {'name': 'pets', 'type': 'boolean', 'label': 'Bringing Pets'},
                        {'name': 'special_requests', 'type': 'textarea', 'label': 'Special Requests'},
                    ]
                }
            },
            {
                'name': 'Apartment Viewing',
                'slug': 'apartment-viewing',
                'description': 'Schedule property viewings for rent or purchase',
                'icon': 'Eye',
                'color': '#3B82F6',
                'requires_dates': True,
                'requires_time_slot': True,
                'requires_guests': False,
                'requires_vehicle_info': False,
                'schema': {
                    'fields': [
                        {'name': 'interested_in', 'type': 'select', 'label': 'Interested In', 'choices': ['buying', 'renting']},
                        {'name': 'budget', 'type': 'number', 'label': 'Budget'},
                    ]
                }
            },
            {
                'name': 'Service Booking',
                'slug': 'service-booking',
                'description': 'Book services like cleaning, repairs, maintenance',
                'icon': 'Wrench',
                'color': '#F59E0B',
                'requires_dates': True,
                'requires_time_slot': True,
                'requires_guests': False,
                'requires_vehicle_info': False,
                'schema': {
                    'fields': [
                        {'name': 'service_type', 'type': 'select', 'label': 'Service Type', 'choices': ['cleaning', 'repair', 'maintenance', 'plumbing', 'electrical']},
                        {'name': 'description', 'type': 'textarea', 'label': 'Service Description', 'required': True},
                    ]
                }
            },
            {
                'name': 'Car Rental',
                'slug': 'car-rental',
                'description': 'Rent cars and vehicles',
                'icon': 'Car',
                'color': '#EF4444',
                'requires_dates': True,
                'requires_time_slot': True,
                'requires_guests': False,
                'requires_vehicle_info': True,
                'schema': {
                    'fields': [
                        {'name': 'driver_age', 'type': 'number', 'label': 'Driver Age', 'required': True},
                        {'name': 'insurance', 'type': 'select', 'label': 'Insurance', 'choices': ['basic', 'standard', 'premium']},
                        {'name': 'additional_drivers', 'type': 'number', 'label': 'Additional Drivers'},
                    ]
                }
            },
            {
                'name': 'Hotel Booking',
                'slug': 'hotel-booking',
                'description': 'Book hotel rooms and accommodations',
                'icon': 'Building',
                'color': '#8B5CF6',
                'requires_dates': True,
                'requires_time_slot': False,
                'requires_guests': True,
                'requires_vehicle_info': False,
                'schema': {
                    'fields': [
                        {'name': 'room_type', 'type': 'select', 'label': 'Room Type', 'choices': ['single', 'double', 'suite']},
                        {'name': 'meal_plan', 'type': 'select', 'label': 'Meal Plan', 'choices': ['none', 'breakfast', 'half_board', 'full_board']},
                    ]
                }
            },
            {
                'name': 'Appointment',
                'slug': 'appointment',
                'description': 'Book appointments for hair, beauty, medical, consultations',
                'icon': 'Calendar',
                'color': '#10B981',
                'requires_dates': True,
                'requires_time_slot': True,
                'requires_guests': False,
                'requires_vehicle_info': False,
                'schema': {
                    'fields': [
                        {'name': 'appointment_type', 'type': 'select', 'label': 'Appointment Type', 'choices': ['hair', 'beauty', 'medical', 'dental', 'consultation']},
                        {'name': 'duration', 'type': 'number', 'label': 'Duration (minutes)', 'default': 30},
                    ]
                }
            },
        ]

        created_count = 0
        updated_count = 0

        for booking_type_data in booking_types:
            slug = booking_type_data['slug']
            booking_type, created = BookingType.objects.update_or_create(
                slug=slug,
                defaults=booking_type_data
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created booking type: {booking_type.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated booking type: {booking_type.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully seeded {created_count} new and updated {updated_count} existing booking types.'
            )
        )
