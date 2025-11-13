# Multi-Domain Business Dashboard Architecture

## Overview

This document outlines the architecture for evolving the Business Dashboard to support a **multi-domain architecture** where businesses can manage:
- **Houses/Properties** (Real Estate) - Listings, bookings, availability
- **Events** - Event creation, ticketing, scheduling
- **Activities** - Activity bookings (e.g., tours, experiences)
- **Appointments** - Service bookings (e.g., nails, haircuts, spa)
- **General Products/Services** - Other marketplace items

The architecture leverages your existing multi-tenant patterns and extends them to support diverse business models on a single dashboard.

---

## Current State Analysis

### Existing Strengths
✅ **Multi-Category Foundation** - `Category` and `SubCategory` models support any domain
✅ **Flexible Listing Model** - `Listing` + `dynamic_fields` (JSON) supports schema-driven attributes
✅ **Booking System** - Unified `bookings.Booking` model handles multiple tenures
✅ **User Segmentation** - `BusinessProfile` with `category` and `subcategory` ForeignKeys
✅ **Intent Router** - Multi-domain classification (real_estate, booking, general)
✅ **WebSocket Architecture** - Real-time messaging for all domains
✅ **SellerProfile** - Flexible business profile with ratings and AI agent toggle

### Current Gaps
❌ Business Dashboard UI is single-domain focused (primarily real estate)
❌ No unified domain orchestration layer for multi-type businesses
❌ Appointment scheduling lacks specific domain tools/agents
❌ Event management not fully integrated
❌ Activity bookings treated as generic listings
❌ No business analytics/insights across domains
❌ Dashboard doesn't segment features by business model

---

## Proposed Multi-Domain Architecture

### 1. Data Model Extensions

#### 1.1 Enhanced BusinessProfile

```python
# users/models.py - EXTEND existing model

class BusinessProfile(models.Model):
    """Enhanced business profile supporting multi-domain operations"""
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                                related_name='business_profile')
    
    business_name = models.CharField(max_length=255)
    
    # Primary & Secondary Categories (multi-domain support)
    primary_category = models.ForeignKey('listings.Category', on_delete=models.SET_NULL, 
                                        null=True, blank=True, related_name='primary_businesses')
    secondary_categories = models.ManyToManyField('listings.Category', blank=True,
                                                 related_name='secondary_businesses',
                                                 help_text="Additional domains this business operates in")
    
    # Enhanced metadata for orchestration
    business_model = models.JSONField(
        default=dict,
        help_text="""
        {
            "domains": ["real_estate", "events", "appointments", "activities"],
            "capabilities": {
                "real_estate": {"features": ["listings", "bookings", "availability"]},
                "events": {"features": ["ticketing", "scheduling", "registrations"]},
                "appointments": {"features": ["scheduling", "reminders", "payments"]},
                "activities": {"features": ["bookings", "capacity", "scheduling"]}
            },
            "payment_processor": "stripe",
            "supports_deposits": true,
            "max_listings": 500,
            "max_events": 100
        }
        """
    )
    
    # Existing fields
    description = models.TextField(blank=True)
    contact_phone = models.CharField(max_length=20)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    is_verified_by_admin = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Dashboard preferences
    dashboard_settings = models.JSONField(
        default=dict,
        help_text="""
        {
            "active_domains": ["real_estate", "appointments"],
            "default_domain": "real_estate",
            "sidebar_layout": "collapsible",
            "show_analytics": true,
            "show_calendar": true,
            "currency": "USD",
            "timezone": "UTC",
            "notification_email": "business@example.com"
        }
        """
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Business Profile"
        verbose_name_plural = "Business Profiles"
    
    def get_active_domains(self):
        """Return list of active domain slugs for this business"""
        return self.dashboard_settings.get('active_domains', [self.primary_category.slug])
    
    def get_capability(self, domain: str) -> dict:
        """Get capabilities for a specific domain"""
        return self.business_model.get('capabilities', {}).get(domain, {})
    
    def supports_domain(self, domain: str) -> bool:
        """Check if business operates in this domain"""
        domains = self.business_model.get('domains', [])
        return domain in domains or domain == self.primary_category.slug


#### 1.2 Domain-Specific Models

# Core abstract model for domain consistency
class DomainBase(models.Model):
    """Abstract base for all domain-specific models"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('users.BusinessProfile', on_delete=models.CASCADE)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Unified metadata
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


# NEW: events/models.py
class Event(DomainBase):
    """Events: Concerts, conferences, workshops, meetups"""
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey('listings.Category', on_delete=models.PROTECT,
                                limit_choices_to={'slug': 'events'})
    
    # Scheduling
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Capacity & registrations
    capacity = models.PositiveIntegerField(help_text="Max attendees. 0 = unlimited")
    registration_count = models.PositiveIntegerField(default=0)
    
    # Location
    location_type = models.CharField(max_length=20, choices=[
        ('physical', 'Physical Venue'),
        ('virtual', 'Virtual (Online)'),
        ('hybrid', 'Hybrid'),
    ])
    location = models.CharField(max_length=255, blank=True)
    location_url = models.URLField(blank=True, help_text="For virtual events")
    
    # Ticketing
    ticket_type = models.CharField(max_length=20, choices=[
        ('free', 'Free'),
        ('paid', 'Paid'),
        ('tiered', 'Tiered Pricing'),
    ])
    base_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='USD')
    
    # Status
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('published', 'Published'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ], default='draft')
    
    image_url = models.URLField(blank=True)
    
    class Meta:
        ordering = ['-start_datetime']
        indexes = [
            models.Index(fields=['business', 'status', '-start_datetime']),
            models.Index(fields=['business', 'start_datetime']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.start_datetime.strftime('%Y-%m-%d')})"


class EventRegistration(models.Model):
    """Attendee registrations for events"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    attendee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    email = models.EmailField()
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    
    # Booking details
    ticket_type = models.CharField(max_length=50, blank=True, help_text="For tiered events")
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=[
        ('registered', 'Registered'),
        ('confirmed', 'Confirmed'),
        ('attended', 'Attended'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ], default='registered')
    
    # Timestamps
    registered_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('event', 'attendee')
        indexes = [
            models.Index(fields=['event', 'status']),
        ]


# NEW: activities/models.py
class Activity(DomainBase):
    """Activities: Tours, experiences, classes, workshops"""
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey('listings.Category', on_delete=models.PROTECT,
                                limit_choices_to={'slug': 'activities'})
    
    # Duration & scheduling
    duration_minutes = models.PositiveIntegerField(help_text="Duration in minutes")
    default_capacity = models.PositiveIntegerField(default=10)
    
    # Pricing
    price_per_person = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    discount_bulk_min = models.PositiveIntegerField(null=True, blank=True,
                                                   help_text="Min people for bulk discount")
    discount_bulk_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Location
    location = models.CharField(max_length=255)
    meeting_point = models.CharField(max_length=255, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('archived', 'Archived'),
    ], default='draft')
    
    image_url = models.URLField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
        ]


class ActivitySession(models.Model):
    """Specific dates/times an activity is offered"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='sessions')
    
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    
    capacity = models.PositiveIntegerField()
    booked_count = models.PositiveIntegerField(default=0)
    
    status = models.CharField(max_length=20, choices=[
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ], default='scheduled')
    
    class Meta:
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['activity', 'start_datetime']),
        ]


class ActivityBooking(models.Model):
    """Booking for an activity session"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ActivitySession, on_delete=models.CASCADE, 
                               related_name='bookings')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    num_participants = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ], default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['session', 'status']),
        ]


# NEW: appointments/models.py
class AppointmentType(DomainBase):
    """Types of appointments: Haircut, Nail Salon, Spa, Doctor, etc."""
    
    name = models.CharField(max_length=255, help_text="e.g., 'Haircut', 'Full Nail Service'")
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField(help_text="Standard duration")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    
    # Staffing
    requires_staff_selection = models.BooleanField(default=False)
    available_staff = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True,
                                            related_name='appointment_types',
                                            help_text="Staff members who offer this service")
    
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ], default='active')
    
    class Meta:
        unique_together = ('business', 'name')
        ordering = ['name']


class AppointmentSlot(models.Model):
    """Available time slots for appointments"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment_type = models.ForeignKey(AppointmentType, on_delete=models.CASCADE,
                                        related_name='slots')
    staff_member = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    null=True, blank=True)
    
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    is_available = models.BooleanField(default=True)
    booked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['appointment_type', 'date', 'is_available']),
            models.Index(fields=['staff_member', 'date']),
        ]


class Appointment(DomainBase):
    """Customer appointments (haircuts, nails, spa, etc.)"""
    
    appointment_type = models.ForeignKey(AppointmentType, on_delete=models.PROTECT)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='appointments')
    slot = models.OneToOneField(AppointmentSlot, on_delete=models.SET_NULL, null=True,
                               related_name='appointment')
    
    # Customer info
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    
    # Booking details
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    staff_member = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='appointments_staff')
    
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    
    # Status workflow
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending Confirmation'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
        ('rescheduled', 'Rescheduled'),
    ], default='pending')
    
    # Notifications
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-start_datetime']
        indexes = [
            models.Index(fields=['business', 'status', '-start_datetime']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['start_datetime', 'status']),
        ]
```

---

### 2. Backend API Layer - Domain Orchestration

#### 2.1 Domain Service Registry

```python
# listings/domain_registry.py
"""
Registry pattern for managing multi-domain features and capabilities.
Allows dashboard to dynamically render features based on business domains.
"""

from enum import Enum
from typing import Dict, List, Any
from dataclasses import dataclass

class DomainType(Enum):
    REAL_ESTATE = "real_estate"
    EVENTS = "events"
    ACTIVITIES = "activities"
    APPOINTMENTS = "appointments"
    SERVICES = "services"
    PRODUCTS = "products"


@dataclass
class DomainFeature:
    """Describes a capability within a domain"""
    name: str
    label: str
    icon: str
    description: str
    requires_model: str  # e.g., "Event", "Appointment"
    permissions: List[str]  # e.g., ["create", "read", "update", "delete"]


class DomainRegistry:
    """Central registry of all domain capabilities"""
    
    DOMAINS = {
        DomainType.REAL_ESTATE: {
            "name": "Real Estate",
            "icon": "Home",
            "color": "#3B82F6",
            "features": {
                "listings": DomainFeature(
                    name="listings",
                    label="Listings",
                    icon="List",
                    description="Manage property listings",
                    requires_model="Listing",
                    permissions=["create", "read", "update", "delete"]
                ),
                "bookings": DomainFeature(
                    name="bookings",
                    label="Bookings",
                    icon="Calendar",
                    description="View and manage bookings",
                    requires_model="Booking",
                    permissions=["read", "update"]
                ),
                "availability": DomainFeature(
                    name="availability",
                    label="Availability Calendar",
                    icon="CalendarDays",
                    description="Manage property availability",
                    requires_model="Availability",
                    permissions=["read", "update"]
                ),
            }
        },
        DomainType.EVENTS: {
            "name": "Events",
            "icon": "Ticket",
            "color": "#EC4899",
            "features": {
                "events": DomainFeature(
                    name="events",
                    label="Events",
                    icon="Ticket",
                    description="Create and manage events",
                    requires_model="Event",
                    permissions=["create", "read", "update", "delete"]
                ),
                "registrations": DomainFeature(
                    name="registrations",
                    label="Registrations",
                    icon="Users",
                    description="View event registrations",
                    requires_model="EventRegistration",
                    permissions=["read", "update"]
                ),
                "ticketing": DomainFeature(
                    name="ticketing",
                    label="Ticket Management",
                    icon="Ticket",
                    description="Manage tickets and pricing",
                    requires_model="Event",
                    permissions=["create", "read", "update"]
                ),
            }
        },
        DomainType.ACTIVITIES: {
            "name": "Activities",
            "icon": "Zap",
            "color": "#F59E0B",
            "features": {
                "activities": DomainFeature(
                    name="activities",
                    label="Activities",
                    icon="MapPin",
                    description="Create and manage activities",
                    requires_model="Activity",
                    permissions=["create", "read", "update", "delete"]
                ),
                "sessions": DomainFeature(
                    name="sessions",
                    label="Session Calendar",
                    icon="Calendar",
                    description="Schedule activity sessions",
                    requires_model="ActivitySession",
                    permissions=["create", "read", "update", "delete"]
                ),
                "bookings": DomainFeature(
                    name="bookings",
                    label="Bookings",
                    icon="CheckCircle",
                    description="View activity bookings",
                    requires_model="ActivityBooking",
                    permissions=["read", "update"]
                ),
            }
        },
        DomainType.APPOINTMENTS: {
            "name": "Appointments",
            "icon": "Clock",
            "color": "#8B5CF6",
            "features": {
                "appointment_types": DomainFeature(
                    name="appointment_types",
                    label="Service Types",
                    icon="Settings",
                    description="Define appointment types",
                    requires_model="AppointmentType",
                    permissions=["create", "read", "update", "delete"]
                ),
                "schedule": DomainFeature(
                    name="schedule",
                    label="Schedule",
                    icon="Clock",
                    description="Manage appointment schedule",
                    requires_model="AppointmentSlot",
                    permissions=["create", "read", "update", "delete"]
                ),
                "appointments": DomainFeature(
                    name="appointments",
                    label="Appointments",
                    icon="Users",
                    description="View and manage appointments",
                    requires_model="Appointment",
                    permissions=["read", "update"]
                ),
                "reminders": DomainFeature(
                    name="reminders",
                    label="Reminders",
                    icon="Bell",
                    description="Send appointment reminders",
                    requires_model="Appointment",
                    permissions=["create", "read"]
                ),
            }
        },
    }
    
    @classmethod
    def get_domain_features(cls, domain_type: DomainType) -> Dict[str, DomainFeature]:
        """Get all features for a domain"""
        return cls.DOMAINS.get(domain_type, {}).get("features", {})
    
    @classmethod
    def get_domain_config(cls, domain_type: DomainType) -> Dict[str, Any]:
        """Get domain configuration (name, icon, color)"""
        return {
            k: v for k, v in cls.DOMAINS.get(domain_type, {}).items()
            if k != "features"
        }
    
    @classmethod
    def get_available_domains(cls) -> List[DomainType]:
        """Get all available domain types"""
        return list(cls.DOMAINS.keys())
```

#### 2.2 Dashboard API Endpoints

```python
# listings/views.py - ADD these endpoints

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class BusinessDashboardViewSet(viewsets.ViewSet):
    """
    Orchestration endpoints for multi-domain business dashboard.
    Provides unified interface for managing all business domains.
    """
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def dashboard_config(self, request):
        """
        GET /api/dashboard/config/
        Returns complete dashboard configuration for authenticated business user.
        """
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "Not a business user"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        active_domains = business.get_active_domains()
        
        config = {
            "business_id": str(business.id),
            "business_name": business.business_name,
            "active_domains": [],
            "available_domains": [],
            "settings": business.dashboard_settings,
        }
        
        # Build active domains with their features
        for domain_slug in active_domains:
            domain_type = self._slug_to_domain_type(domain_slug)
            features = DomainRegistry.get_domain_features(domain_type)
            domain_config = DomainRegistry.get_domain_config(domain_type)
            
            config["active_domains"].append({
                "slug": domain_slug,
                "name": domain_config.get("name"),
                "icon": domain_config.get("icon"),
                "color": domain_config.get("color"),
                "features": {
                    k: {
                        "label": v.label,
                        "icon": v.icon,
                        "description": v.description,
                        "permissions": v.permissions,
                    }
                    for k, v in features.items()
                },
            })
        
        # Build available (not yet active) domains
        for domain_type in DomainRegistry.get_available_domains():
            if domain_type.value not in active_domains:
                config["available_domains"].append({
                    "slug": domain_type.value,
                    "name": DomainRegistry.get_domain_config(domain_type).get("name"),
                    "icon": DomainRegistry.get_domain_config(domain_type).get("icon"),
                })
        
        return Response(config)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        GET /api/dashboard/analytics/?domain=real_estate&period=month
        Returns domain-specific analytics and KPIs.
        """
        business = request.user.business_profile
        domain = request.query_params.get('domain')
        period = request.query_params.get('period', 'month')  # week, month, year
        
        analytics = {}
        
        # Real Estate Analytics
        if domain == 'real_estate' or not domain:
            from real_estate.models import Listing as REListing
            listings = REListing.objects.filter(owner=request.user)
            analytics['real_estate'] = {
                "total_listings": listings.count(),
                "active_listings": listings.filter(status='active').count(),
                "total_bookings": bookings_count,
                "revenue": total_revenue,
                "avg_occupancy": avg_occupancy_percent,
                "recent_bookings": recent_bookings_data,
            }
        
        # Events Analytics
        if domain == 'events' or not domain:
            from events.models import Event, EventRegistration
            events = Event.objects.filter(business=business)
            analytics['events'] = {
                "total_events": events.count(),
                "active_events": events.filter(status='published').count(),
                "total_registrations": EventRegistration.objects.filter(
                    event__business=business
                ).count(),
                "revenue": sum_event_revenue,
                "avg_capacity_utilization": avg_capacity_percent,
            }
        
        # Appointments Analytics
        if domain == 'appointments' or not domain:
            from appointments.models import Appointment
            appointments = Appointment.objects.filter(business=business)
            analytics['appointments'] = {
                "total_appointments": appointments.count(),
                "confirmed": appointments.filter(status='confirmed').count(),
                "completed": appointments.filter(status='completed').count(),
                "no_shows": appointments.filter(status='no_show').count(),
                "revenue": appointment_revenue,
                "avg_customer_rating": avg_rating,
            }
        
        return Response(analytics)
    
    @action(detail=False, methods=['post'])
    def enable_domain(self, request):
        """
        POST /api/dashboard/enable-domain/
        Payload: {"domain": "events"}
        Enable a new domain for this business.
        """
        business = request.user.business_profile
        domain = request.data.get('domain')
        
        if domain not in [d.value for d in DomainRegistry.get_available_domains()]:
            return Response(
                {"error": "Invalid domain"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update dashboard settings
        settings = business.dashboard_settings
        if domain not in settings.get('active_domains', []):
            settings['active_domains'].append(domain)
            business.dashboard_settings = settings
            business.save()
        
        return Response({"status": "enabled", "domain": domain})
    
    @action(detail=False, methods=['get'])
    def unified_calendar(self, request):
        """
        GET /api/dashboard/unified-calendar/?date=2025-11-15
        Returns all scheduled items across all domains for a business.
        """
        business = request.user.business_profile
        date_str = request.query_params.get('date')  # YYYY-MM-DD
        
        events = []
        
        # Real Estate bookings
        from bookings.models import Booking as REBooking
        for booking in REBooking.objects.filter(
            property_listing__owner=request.user,
            check_in_date__date=date_str
        ):
            events.append({
                "type": "booking",
                "domain": "real_estate",
                "title": f"Booking: {booking.property_listing.title}",
                "datetime": booking.check_in_date,
                "guest": booking.guest_name,
                "status": booking.status,
            })
        
        # Events
        from events.models import Event
        for event in Event.objects.filter(
            business=business,
            start_datetime__date=date_str
        ):
            events.append({
                "type": "event",
                "domain": "events",
                "title": event.title,
                "datetime": event.start_datetime,
                "capacity": f"{event.registration_count}/{event.capacity}",
                "status": event.status,
            })
        
        # Appointments
        from appointments.models import Appointment
        for appointment in Appointment.objects.filter(
            business=business,
            start_datetime__date=date_str
        ):
            events.append({
                "type": "appointment",
                "domain": "appointments",
                "title": f"{appointment.appointment_type.name} - {appointment.customer_name}",
                "datetime": appointment.start_datetime,
                "duration_minutes": appointment.appointment_type.duration_minutes,
                "status": appointment.status,
            })
        
        # Activities
        from activities.models import ActivityBooking
        for booking in ActivityBooking.objects.filter(
            session__activity__business=business,
            session__start_datetime__date=date_str
        ):
            events.append({
                "type": "activity_booking",
                "domain": "activities",
                "title": f"{booking.session.activity.title}",
                "datetime": booking.session.start_datetime,
                "participants": booking.num_participants,
                "status": booking.status,
            })
        
        # Sort by datetime
        events.sort(key=lambda x: x['datetime'])
        
        return Response(events)
    
    def _slug_to_domain_type(self, slug: str) -> DomainType:
        """Convert slug to DomainType enum"""
        for dt in DomainRegistry.get_available_domains():
            if dt.value == slug:
                return dt
        raise ValueError(f"Unknown domain: {slug}")
```

#### 2.3 Updated Router for Multi-Domain

```python
# router_service/router.py - UPDATE intent classification

INTENT_DOMAINS = {
    "real_estate": ["property", "apartment", "house", "rental", "booking"],
    "events": ["event", "concert", "conference", "workshop", "ticket", "registration"],
    "activities": ["activity", "tour", "experience", "class", "lesson"],
    "appointments": ["appointment", "booking", "haircut", "nail", "spa", "salon", "doctor"],
    "general": ["question", "help", "info"],
}

def classify_business_intent(utterance: str, business: BusinessProfile) -> dict:
    """
    Classify user utterance to business domain, considering business capabilities.
    
    Returns: {
        "domain": "real_estate|events|activities|appointments|general",
        "confidence": 0.95,
        "suggested_tool": "search_properties|create_event|book_activity|schedule_appointment"
    }
    """
    active_domains = business.get_active_domains()
    
    # Use existing router to get initial classification
    initial_intent = router_service.classify_intent(utterance)
    
    # If predicted domain is not active, fallback to general or first active domain
    if initial_intent['domain'] not in active_domains:
        return {
            "domain": active_domains[0] if active_domains else "general",
            "confidence": 0.5,  # Lower confidence due to fallback
            "suggested_tool": "search_listings"
        }
    
    return initial_intent
```

---

### 3. Frontend Architecture - Multi-Domain Dashboard

#### 3.1 Dashboard Structure

```
frontend/src/features/dashboard/
├── components/
│   ├── DashboardLayout.tsx          # Main layout with sidebar
│   ├── DomainSidebar.tsx            # Domain switcher
│   ├── DashboardHeader.tsx          # Top bar with domain info
│   ├── UnifiedCalendarWidget.tsx    # Cross-domain calendar
│   ├── AnalyticsDashboard.tsx       # KPI cards
│   └── QuickActionsMenu.tsx         # "New listing", "New event", etc.
├── domains/
│   ├── realEstate/
│   │   ├── RealEstateDomain.tsx    # Real estate section
│   │   ├── ListingsTab.tsx
│   │   ├── BookingsTab.tsx
│   │   └── AvailabilityTab.tsx
│   ├── events/
│   │   ├── EventsDomain.tsx
│   │   ├── EventListTab.tsx
│   │   ├── RegistrationsTab.tsx
│   │   └── CreateEventForm.tsx
│   ├── activities/
│   │   ├── ActivitiesDomain.tsx
│   │   ├── ActivityListTab.tsx
│   │   ├── SessionScheduler.tsx
│   │   └── BookingsTab.tsx
│   ├── appointments/
│   │   ├── AppointmentsDomain.tsx
│   │   ├── ServiceTypesTab.tsx
│   │   ├── ScheduleTab.tsx
│   │   ├── AppointmentsTab.tsx
│   │   └── ReminderManager.tsx
│   └── common/
│       ├── FormBuilder.tsx          # Dynamic form based on schema
│       ├── ImageUploader.tsx
│       └── PricingEditor.tsx
├── hooks/
│   ├── useDomainConfig.ts           # Get domain configuration
│   ├── useAnalytics.ts              # Fetch analytics per domain
│   ├── useMultiDomainAPI.ts         # Unified API layer
│   └── useUnifiedCalendar.ts        # Cross-domain calendar state
└── types/
    ├── dashboard.ts
    ├── domains.ts
    └── analytics.ts
```

#### 3.2 Key Frontend Components

```typescript
// frontend/src/features/dashboard/hooks/useDomainConfig.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface DomainConfig {
  slug: string;
  name: string;
  icon: string;
  color: string;
  features: Record<string, {
    label: string;
    icon: string;
    description: string;
    permissions: string[];
  }>;
}

export interface DashboardConfig {
  business_id: string;
  business_name: string;
  active_domains: DomainConfig[];
  available_domains: { slug: string; name: string; icon: string }[];
  settings: Record<string, any>;
}

export const useDomainConfig = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-config'],
    queryFn: async () => {
      const response = await api.get<DashboardConfig>('/api/dashboard/config/');
      return response.data;
    },
  });

  return { config: data, isLoading, error };
};


// frontend/src/features/dashboard/components/DashboardLayout.tsx
import React, { useState } from 'react';
import { useDomainConfig } from '../hooks/useDomainConfig';
import { DomainSidebar } from './DomainSidebar';
import { RealEstateDomain } from '../domains/realEstate/RealEstateDomain';
import { EventsDomain } from '../domains/events/EventsDomain';
import { ActivitiesDomain } from '../domains/activities/ActivitiesDomain';
import { AppointmentsDomain } from '../domains/appointments/AppointmentsDomain';

export const DashboardLayout: React.FC = () => {
  const { config, isLoading } = useDomainConfig();
  const [activeDomain, setActiveDomain] = useState<string>('');

  if (isLoading || !config) {
    return <div>Loading...</div>;
  }

  // Set initial active domain from settings
  const defaultDomain = config.settings.default_domain || config.active_domains[0]?.slug;

  const currentDomain = activeDomain || defaultDomain;

  const renderDomainContent = () => {
    switch (currentDomain) {
      case 'real_estate':
        return <RealEstateDomain />;
      case 'events':
        return <EventsDomain />;
      case 'activities':
        return <ActivitiesDomain />;
      case 'appointments':
        return <AppointmentsDomain />;
      default:
        return <div>Select a domain</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar with domain switcher */}
      <DomainSidebar
        config={config}
        activeDomain={currentDomain}
        onDomainChange={setActiveDomain}
      />

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              {config.active_domains.find(d => d.slug === currentDomain)?.name}
            </h1>
          </div>

          {renderDomainContent()}
        </div>
      </div>
    </div>
  );
};


// frontend/src/features/dashboard/components/DomainSidebar.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DashboardConfig } from '../hooks/useDomainConfig';

interface Props {
  config: DashboardConfig;
  activeDomain: string;
  onDomainChange: (domain: string) => void;
}

export const DomainSidebar: React.FC<Props> = ({
  config,
  activeDomain,
  onDomainChange,
}) => {
  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold">{config.business_name}</h2>
      </div>

      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4">
          Domains
        </h3>

        {/* Active domains */}
        {config.active_domains.map(domain => (
          <button
            key={domain.slug}
            onClick={() => onDomainChange(domain.slug)}
            className={`w-full text-left px-4 py-3 mb-2 rounded-lg flex items-center gap-3 transition ${
              activeDomain === domain.slug
                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{domain.icon}</span>
            <span className="font-medium">{domain.name}</span>
          </button>
        ))}

        {/* Available domains */}
        {config.available_domains.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Available Domains
            </h3>
            {config.available_domains.map(domain => (
              <button
                key={domain.slug}
                onClick={() => {
                  // TODO: Enable domain via API
                }}
                className="w-full text-left px-4 py-3 mb-2 rounded-lg flex items-center gap-3 text-gray-500 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">{domain.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// frontend/src/features/dashboard/components/UnifiedCalendarWidget.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarEvent {
  type: 'booking' | 'event' | 'appointment' | 'activity_booking';
  domain: string;
  title: string;
  datetime: string;
  status: string;
  [key: string]: any;
}

export const UnifiedCalendarWidget: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: events } = useQuery({
    queryKey: ['unified-calendar', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await api.get<CalendarEvent[]>(
        `/api/dashboard/unified-calendar/`,
        {
          params: { date: format(selectedDate, 'yyyy-MM-dd') },
        }
      );
      return response.data;
    },
  });

  const getDomainColor = (domain: string) => {
    const colors = {
      real_estate: 'bg-blue-100 text-blue-700',
      events: 'bg-pink-100 text-pink-700',
      activities: 'bg-amber-100 text-amber-700',
      appointments: 'bg-purple-100 text-purple-700',
    };
    return colors[domain as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5" />
        <h3 className="font-semibold">
          {format(selectedDate, 'MMMM dd, yyyy')}
        </h3>
      </div>

      {events && events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${getDomainColor(event.domain)}`}
            >
              <div className="font-medium text-sm">{event.title}</div>
              <div className="text-xs opacity-75 mt-1">
                {format(new Date(event.datetime), 'h:mm a')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No events scheduled</div>
      )}
    </div>
  );
};
```

---

### 4. Event-Driven Orchestration

#### 4.1 Domain Events

```python
# listings/events.py - Event system for multi-domain orchestration

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict
from enum import Enum

class DomainEventType(Enum):
    # Real Estate
    LISTING_CREATED = "listing.created"
    BOOKING_CONFIRMED = "booking.confirmed"
    BOOKING_CANCELLED = "booking.cancelled"
    
    # Events
    EVENT_CREATED = "event.created"
    EVENT_PUBLISHED = "event.published"
    REGISTRATION_CONFIRMED = "registration.confirmed"
    
    # Activities
    ACTIVITY_CREATED = "activity.created"
    SESSION_SCHEDULED = "session.scheduled"
    ACTIVITY_BOOKING_CONFIRMED = "activity_booking.confirmed"
    
    # Appointments
    APPOINTMENT_SCHEDULED = "appointment.scheduled"
    APPOINTMENT_CONFIRMED = "appointment.confirmed"
    APPOINTMENT_CANCELLED = "appointment.cancelled"
    REMINDER_TRIGGERED = "reminder.triggered"
    
    # Cross-domain
    BUSINESS_NOTIFICATION_NEEDED = "business.notification_needed"
    CUSTOMER_NOTIFICATION_NEEDED = "customer.notification_needed"


@dataclass
class DomainEvent:
    """Base event for all domain operations"""
    event_type: DomainEventType
    business_id: str
    timestamp: datetime
    data: Dict[str, Any]
    metadata: Dict[str, Any] = None
    
    def to_dict(self) -> dict:
        return {
            'event_type': self.event_type.value,
            'business_id': self.business_id,
            'timestamp': self.timestamp.isoformat(),
            'data': self.data,
            'metadata': self.metadata or {},
        }


# listings/event_handlers.py - Event handlers for cross-domain logic

from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from celery import shared_task
import json

@shared_task
def handle_domain_event(event_dict: dict):
    """
    Celery task to handle domain events.
    Allows async, retryable processing of business logic.
    """
    event_type = event_dict['event_type']
    business_id = event_dict['business_id']
    data = event_dict['data']
    
    # Route to appropriate handler
    if event_type == DomainEventType.BOOKING_CONFIRMED.value:
        handle_booking_confirmed(business_id, data)
    elif event_type == DomainEventType.REGISTRATION_CONFIRMED.value:
        handle_registration_confirmed(business_id, data)
    elif event_type == DomainEventType.APPOINTMENT_SCHEDULED.value:
        handle_appointment_scheduled(business_id, data)
    # ... more handlers


def handle_booking_confirmed(business_id: str, data: dict):
    """Send confirmation email, update calendar, etc."""
    from bookings.models import Booking
    from users.models import BusinessProfile
    
    business = BusinessProfile.objects.get(id=business_id)
    booking = Booking.objects.get(id=data['booking_id'])
    
    # Send notification email
    send_booking_confirmation_email(business, booking)
    
    # Update unified calendar via WebSocket
    from asgiref.sync import async_to_sync
    async_to_sync(notify_business_calendar_update)(
        business_id,
        event_type='booking_confirmed',
        event_data={
            'booking_id': str(booking.id),
            'title': f"Booking confirmed: {booking.property_listing.title}",
        }
    )


def handle_registration_confirmed(business_id: str, data: dict):
    """Send event confirmation, update capacity, etc."""
    # Similar pattern


def handle_appointment_scheduled(business_id: str, data: dict):
    """Schedule reminder, notify staff, update calendar"""
    # Schedule reminder task for 24 hours before
    from appointments.models import Appointment
    from easy_islanders.celery import app
    
    appointment = Appointment.objects.get(id=data['appointment_id'])
    
    # Schedule reminder
    app.send_task(
        'appointments.tasks.send_reminder',
        args=[str(appointment.id)],
        countdown=86400,  # 24 hours before
    )


# Emit events from model saves

@receiver(post_save, sender=Booking)
def emit_booking_event(sender, instance, created, **kwargs):
    """Emit event when booking status changes"""
    if instance.status == 'confirmed':
        event = DomainEvent(
            event_type=DomainEventType.BOOKING_CONFIRMED,
            business_id=str(instance.property_listing.owner.business_profile.id),
            timestamp=datetime.now(),
            data={'booking_id': str(instance.id)},
        )
        handle_domain_event.delay(event.to_dict())


@receiver(post_save, sender=Appointment)
def emit_appointment_event(sender, instance, created, **kwargs):
    """Emit event when appointment is created/confirmed"""
    if created:
        event = DomainEvent(
            event_type=DomainEventType.APPOINTMENT_SCHEDULED,
            business_id=str(instance.business_id),
            timestamp=datetime.now(),
            data={'appointment_id': str(instance.id)},
        )
        handle_domain_event.delay(event.to_dict())
```

---

### 5. Unified Analytics & Reporting

```python
# listings/analytics.py - Cross-domain analytics

from typing import Dict, Any
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Q, Avg

class BusinessAnalytics:
    """Unified analytics across all business domains"""
    
    def __init__(self, business_profile):
        self.business = business_profile
    
    def get_revenue_by_domain(self, period: str = 'month') -> Dict[str, float]:
        """Calculate revenue per domain"""
        from real_estate.models import Booking as REBooking
        from events.models import EventRegistration
        from activities.models import ActivityBooking
        from appointments.models import Appointment
        
        start_date = self._get_period_start(period)
        
        revenue = {}
        
        # Real estate revenue
        re_revenue = REBooking.objects.filter(
            property_listing__owner=self.business.user,
            created_at__gte=start_date,
            status='confirmed'
        ).aggregate(total=Sum('total_price'))['total'] or 0
        revenue['real_estate'] = float(re_revenue)
        
        # Events revenue
        events_revenue = EventRegistration.objects.filter(
            event__business=self.business,
            registered_at__gte=start_date,
            status__in=['confirmed', 'attended']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        revenue['events'] = float(events_revenue)
        
        # Activities revenue
        activities_revenue = ActivityBooking.objects.filter(
            session__activity__business=self.business,
            created_at__gte=start_date,
            status__in=['confirmed', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        revenue['activities'] = float(activities_revenue)
        
        # Appointments revenue
        appointments_revenue = Appointment.objects.filter(
            business=self.business,
            created_at__gte=start_date,
            status__in=['confirmed', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        revenue['appointments'] = float(appointments_revenue)
        
        return revenue
    
    def get_activity_timeline(self, period: str = 'month') -> list:
        """Timeline of all bookings/registrations across domains"""
        from real_estate.models import Booking as REBooking
        from events.models import EventRegistration
        from activities.models import ActivityBooking
        from appointments.models import Appointment
        
        start_date = self._get_period_start(period)
        
        timeline = []
        
        # Real estate
        for booking in REBooking.objects.filter(
            property_listing__owner=self.business.user,
            created_at__gte=start_date
        ):
            timeline.append({
                'date': booking.created_at,
                'domain': 'real_estate',
                'type': 'booking',
                'title': booking.property_listing.title,
                'status': booking.status,
            })
        
        # Events
        for reg in EventRegistration.objects.filter(
            event__business=self.business,
            registered_at__gte=start_date
        ):
            timeline.append({
                'date': reg.registered_at,
                'domain': 'events',
                'type': 'registration',
                'title': reg.event.title,
                'status': reg.status,
            })
        
        # Activities
        for booking in ActivityBooking.objects.filter(
            session__activity__business=self.business,
            created_at__gte=start_date
        ):
            timeline.append({
                'date': booking.created_at,
                'domain': 'activities',
                'type': 'booking',
                'title': booking.session.activity.title,
                'status': booking.status,
            })
        
        # Appointments
        for appt in Appointment.objects.filter(
            business=self.business,
            created_at__gte=start_date
        ):
            timeline.append({
                'date': appt.created_at,
                'domain': 'appointments',
                'type': 'appointment',
                'title': appt.appointment_type.name,
                'status': appt.status,
            })
        
        return sorted(timeline, key=lambda x: x['date'], reverse=True)
    
    def _get_period_start(self, period: str) -> datetime:
        """Get start date for a period"""
        now = datetime.now()
        if period == 'week':
            return now - timedelta(days=7)
        elif period == 'month':
            return now - timedelta(days=30)
        elif period == 'year':
            return now - timedelta(days=365)
        return now
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create domain models (Event, Activity, Appointment)
- [ ] Extend BusinessProfile with multi-domain support
- [ ] Create DomainRegistry
- [ ] Implement dashboard config API endpoints

### Phase 2: Frontend Scaffold (Weeks 3-4)
- [ ] Build DashboardLayout with domain switcher
- [ ] Create domain placeholders (real_estate, events, activities, appointments)
- [ ] Implement unified calendar widget
- [ ] Create analytics dashboard skeleton

### Phase 3: Real Estate Domain (Weeks 5-6)
- [ ] Migrate existing RE functionality to new dashboard
- [ ] Real estate listings tab
- [ ] Bookings management
- [ ] Availability calendar

### Phase 4: Events Domain (Weeks 7-8)
- [ ] Event creation form
- [ ] Registration management
- [ ] Ticket pricing
- [ ] Event calendar

### Phase 5: Activities Domain (Weeks 9-10)
- [ ] Activity listing
- [ ] Session scheduling
- [ ] Booking management

### Phase 6: Appointments Domain (Weeks 11-12)
- [ ] Service type configuration
- [ ] Schedule management
- [ ] Appointment booking
- [ ] Reminder system

### Phase 7: Cross-Domain Features (Weeks 13-14)
- [ ] Analytics dashboard
- [ ] Event-driven orchestration
- [ ] Unified notifications
- [ ] Reporting

---

## Key Design Principles

### 1. **Extensibility**
- Each domain can be added without modifying core code
- DomainRegistry makes it easy to register new domains
- JSON schema-driven forms allow flexible fields per category

### 2. **Consistency**
- All domains follow same data model patterns (owner, created_at, etc.)
- Unified booking/scheduling across different domains
- Consistent API contracts

### 3. **Isolation**
- Each domain has its own models and views
- Business logic is domain-specific
- Shared utilities (authentication, validation) are common

### 4. **Orchestration**
- DomainEvent system allows cross-domain workflows
- AsyncAPI (via WebSocket) broadcasts updates
- Celery tasks handle async notifications

### 5. **Analytics**
- BusinessAnalytics class aggregates metrics across domains
- Unified calendar shows all bookings/events
- Revenue and activity reports span all domains

---

## API Summary

### Dashboard Configuration
```
GET /api/dashboard/config/
→ Returns: active_domains, features, settings
```

### Domain Management
```
POST /api/dashboard/enable-domain/
→ Enable new domain for business

GET /api/dashboard/unified-calendar/?date=2025-11-15
→ Returns: all events across domains for a date

GET /api/dashboard/analytics/?domain=events&period=month
→ Returns: KPIs and metrics per domain
```

### Domain-Specific APIs
```
POST /api/events/
POST /api/activities/
POST /api/appointments/
POST /api/appointment-types/
```

---

## Backend Orchestration - Domain Service Pattern

The key to scaling this is a **standardized interface** all domains implement:

```python
# listings/base_domain_service.py

from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseDomainService(ABC):
    """
    Abstract service that each domain (real_estate, events, activities, etc.)
    implements to provide consistent contracts.
    """
    
    domain_slug: str  # 'real_estate', 'events', 'activities', etc.
    
    @abstractmethod
    def get_listings(self, seller_user) -> List[Dict]:
        """Return all listings for a seller in this domain"""
        pass
    
    @abstractmethod
    def get_metrics(self, seller_user, period='month') -> Dict[str, Any]:
        """
        Return domain-specific metrics:
        {
            'total_listings': 5,
            'active_listings': 4,
            'total_bookings': 12,
            'booking_rate': 0.85,
            'revenue': 1200.00,
            'avg_rating': 4.7,
        }
        """
        pass
    
    @abstractmethod
    def get_bookings(self, seller_user) -> List[Dict]:
        """Return all bookings/reservations in this domain"""
        pass
    
    @abstractmethod
    def create_listing(self, seller_user, payload: Dict) -> Dict:
        """Create a new listing in this domain"""
        pass
    
    @abstractmethod
    def update_listing(self, seller_user, listing_id: str, payload: Dict) -> Dict:
        """Update an existing listing"""
        pass
    
    @abstractmethod
    def get_listing_detail(self, listing_id: str) -> Dict:
        """Get detailed listing info including bookings, reviews, etc."""
        pass


# real_estate/services.py

from listings.base_domain_service import BaseDomainService

class RealEstateDomainService(BaseDomainService):
    domain_slug = 'real_estate'
    
    def get_listings(self, seller_user):
        from real_estate.models import Listing as REListing
        listings = REListing.objects.filter(owner=seller_user)
        return [
            {
                'id': str(l.id),
                'title': l.title,
                'tenure': l.tenure,
                'price': float(l.price_amount),
                'status': l.status,
                'created_at': l.created_at.isoformat(),
                'image_url': l.images.first().image.url if l.images.exists() else None,
            }
            for l in listings
        ]
    
    def get_metrics(self, seller_user, period='month'):
        from real_estate.models import Booking
        from datetime import datetime, timedelta
        
        start_date = datetime.now() - timedelta(days=30 if period == 'month' else 7)
        
        listings = self.get_listings(seller_user)
        bookings = Booking.objects.filter(
            property_listing__owner=seller_user,
            created_at__gte=start_date
        )
        
        total_revenue = sum(float(b.total_price) for b in bookings if b.status == 'confirmed')
        
        return {
            'domain': self.domain_slug,
            'total_listings': len(listings),
            'active_listings': sum(1 for l in listings if l['status'] == 'active'),
            'total_bookings': bookings.count(),
            'confirmed_bookings': bookings.filter(status='confirmed').count(),
            'revenue': total_revenue,
            'booking_rate': bookings.filter(status='confirmed').count() / max(bookings.count(), 1),
        }
    
    # ... implement other abstract methods


# events/services.py

class EventsDomainService(BaseDomainService):
    domain_slug = 'events'
    
    def get_listings(self, seller_user):
        from events.models import Event
        events = Event.objects.filter(owner=seller_user)
        return [
            {
                'id': str(e.id),
                'title': e.title,
                'start_datetime': e.start_datetime.isoformat(),
                'capacity': e.capacity,
                'registered': e.registration_count,
                'status': e.status,
                'image_url': e.image_url,
            }
            for e in events
        ]
    
    # ... implement other abstract methods
```

### Seller Portal Aggregator

```python
# seller_portal/views.py - Single orchestration layer

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from listings.domain_registry import DomainRegistry

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_overview(request):
    """
    GET /api/seller/overview/
    Unified dashboard overview across all seller's domains.
    """
    business = request.user.business_profile
    
    # Get services for each active domain
    active_domains = business.get_active_domains()
    
    overview = {
        'business_id': str(business.id),
        'business_name': business.business_name,
        'total_listings': 0,
        'total_bookings': 0,
        'total_revenue': 0.0,
        'domains': [],
    }
    
    for domain_slug in active_domains:
        # Dynamically import service for domain
        service = _get_domain_service(domain_slug)
        
        metrics = service.get_metrics(request.user)
        
        overview['domains'].append(metrics)
        overview['total_listings'] += metrics.get('total_listings', 0)
        overview['total_bookings'] += metrics.get('total_bookings', 0)
        overview['total_revenue'] += metrics.get('revenue', 0.0)
    
    return Response(overview)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_listings(request):
    """
    GET /api/seller/listings/?domain=real_estate
    Unified listings across all domains, optionally filtered by domain.
    """
    business = request.user.business_profile
    filter_domain = request.query_params.get('domain')
    
    listings = []
    
    for domain_slug in business.get_active_domains():
        if filter_domain and filter_domain != domain_slug:
            continue
        
        service = _get_domain_service(domain_slug)
        domain_listings = service.get_listings(request.user)
        
        for listing in domain_listings:
            listing['domain'] = domain_slug
        
        listings.extend(domain_listings)
    
    return Response(listings)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_bookings(request):
    """
    GET /api/seller/bookings/?status=pending
    Unified bookings across all domains.
    """
    business = request.user.business_profile
    status_filter = request.query_params.get('status')
    
    bookings = []
    
    for domain_slug in business.get_active_domains():
        service = _get_domain_service(domain_slug)
        domain_bookings = service.get_bookings(request.user)
        
        if status_filter:
            domain_bookings = [b for b in domain_bookings if b.get('status') == status_filter]
        
        for booking in domain_bookings:
            booking['domain'] = domain_slug
        
        bookings.extend(domain_bookings)
    
    # Sort by most recent
    bookings.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return Response(bookings)


def _get_domain_service(domain_slug: str):
    """Factory to get appropriate domain service"""
    services = {
        'real_estate': 'real_estate.services.RealEstateDomainService',
        'events': 'events.services.EventsDomainService',
        'activities': 'activities.services.ActivitiesDomainService',
        'appointments': 'appointments.services.AppointmentsDomainService',
    }
    
    module_path, class_name = services[domain_slug].rsplit('.', 1)
    module = __import__(module_path, fromlist=[class_name])
    return getattr(module, class_name)()
```

---

## Frontend Orchestration - Adaptive UI Components

```typescript
// frontend/src/features/seller-dashboard/hooks/useDomainServices.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

interface DomainMetrics {
  domain: string;
  total_listings: number;
  total_bookings: number;
  revenue: number;
  [key: string]: any;
}

export const useSummarizedMetrics = () => {
  return useQuery({
    queryKey: ['seller-overview'],
    queryFn: async () => {
      const response = await api.get('/api/seller/overview/');
      return response.data;
    },
  });
};

export const useUnifiedListings = (domain?: string) => {
  return useQuery({
    queryKey: ['seller-listings', domain],
    queryFn: async () => {
      const params = domain ? { domain } : {};
      const response = await api.get('/api/seller/listings/', { params });
      return response.data;
    },
  });
};

export const useUnifiedBookings = (status?: string) => {
  return useQuery({
    queryKey: ['seller-bookings', status],
    queryFn: async () => {
      const params = status ? { status } : {};
      const response = await api.get('/api/seller/bookings/', { params });
      return response.data;
    },
  });
};


// frontend/src/features/seller-dashboard/components/SellerDashboard.tsx

import React, { useState } from 'react';
import { useSummarizedMetrics, useUnifiedListings, useUnifiedBookings } from '../hooks/useDomainServices';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainMetricsCard } from './DomainMetricsCard';
import { UnifiedListingsTable } from './UnifiedListingsTable';
import { UnifiedBookingsTable } from './UnifiedBookingsTable';

export const SellerDashboard: React.FC = () => {
  const { data: overview, isLoading: overviewLoading } = useSummarizedMetrics();
  const { data: listings } = useUnifiedListings();
  const { data: bookings } = useUnifiedBookings();
  const [activeTab, setActiveTab] = useState('overview');

  if (overviewLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{overview.business_name}</h1>
        <p className="text-gray-600">Manage all your listings, bookings, and revenue</p>
      </div>

      {/* KPI Cards - Cross Domain */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_listings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_bookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview.total_revenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Domains Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.domains.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Domain-Specific Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {overview.domains.map((domain: any) => (
          <DomainMetricsCard key={domain.domain} metrics={domain} />
        ))}
      </div>

      {/* Tabs - Listings, Bookings, etc. */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="broadcasts">Requests & Broadcasts</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Overview Tab - Summary dashboard shown above */}
        </TabsContent>

        <TabsContent value="listings">
          <UnifiedListingsTable listings={listings || []} />
        </TabsContent>

        <TabsContent value="bookings">
          <UnifiedBookingsTable bookings={bookings || []} />
        </TabsContent>

        {/* Other tabs... */}
      </Tabs>
    </div>
  );
};


// frontend/src/features/seller-dashboard/components/DomainMetricsCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DOMAIN_CONFIG = {
  real_estate: { icon: '🏠', color: 'bg-blue-100', textColor: 'text-blue-700' },
  events: { icon: '🎉', color: 'bg-pink-100', textColor: 'text-pink-700' },
  activities: { icon: '⚡', color: 'bg-amber-100', textColor: 'text-amber-700' },
  appointments: { icon: '⏰', color: 'bg-purple-100', textColor: 'text-purple-700' },
};

export const DomainMetricsCard: React.FC<{ metrics: any }> = ({ metrics }) => {
  const config = DOMAIN_CONFIG[metrics.domain as keyof typeof DOMAIN_CONFIG];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={`text-2xl ${config.color} rounded px-2 py-1`}>
            {config.icon}
          </span>
          {metrics.domain.replace('_', ' ').toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Listings</span>
            <span className="font-bold">{metrics.total_listings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Bookings</span>
            <span className="font-bold">{metrics.total_bookings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Revenue</span>
            <span className="font-bold">${metrics.revenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Booking Rate</span>
            <span className="font-bold">
              {(metrics.booking_rate * 100 || 0).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## Implementation Priority: Critical Path

### Phase 1: Backend Scaffold (Week 1)
- [ ] Create `seller_portal/` app with aggregator endpoints
- [ ] Implement `BaseDomainService` interface
- [ ] Create `RealEstateDomainService` (reference implementation)
- [ ] Register service factory in `_get_domain_service()`

### Phase 2: Frontend Shell (Week 2)
- [ ] Build `SellerDashboard` main component with Tabs
- [ ] Create domain metrics hooks
- [ ] Implement KPI cards (total listings, bookings, revenue)
- [ ] Wire up `/api/seller/overview/` endpoint

### Phase 3: Unified Listings & Bookings (Week 3)
- [ ] Implement `UnifiedListingsTable` with domain filtering
- [ ] Implement `UnifiedBookingsTable` with status filtering
- [ ] Add quick actions (view, edit, respond to booking)

### Phase 4: Multi-Domain Support (Week 4)
- [ ] Implement `EventsDomainService`
- [ ] Implement `ActivitiesDomainService`
- [ ] Implement `AppointmentsDomainService`
- [ ] Verify aggregation works across all domains

### Phase 5: Analytics & Insights (Week 5)
- [ ] Cross-domain analytics endpoint
- [ ] Revenue by domain chart
- [ ] Booking trends over time
- [ ] AI-powered insights (assistant messages)

---

## Integration with Existing Architecture

✅ **Already Built**
- User/BusinessProfile models
- Category system with JSON schemas
- Multi-domain Listing model
- Intent router

✅ **Reuses**
- WebSocket chat for messages/broadcasts
- Django Channels for real-time updates
- Celery for async notifications
- PostgreSQL with pgvector

---

## Questions & Next Steps

1. **Payment Processing**: How should multi-currency payments be handled?
2. **Staff Management**: Appointments need staff scheduling - shared staff across domains?
3. **Notification Preferences**: Different notification rules per domain?
4. **Subscription Tiers**: Different feature limits per domain/tier?
5. **Mobile App**: Should mobile have simplified multi-domain view?

---

**This architecture provides the foundation for Easy Islanders to become a true multi-domain marketplace where a single business can operate a holiday rental, host events, offer activities, and run a salon—all from one dashboard.**
