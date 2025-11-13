"""
Domain service implementations for each business domain.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
from django.db.models import Sum, Count, Q, Avg
from seller_portal.base_domain_service import BaseDomainService


class RealEstateDomainService(BaseDomainService):
    """Real estate domain service - manages properties, bookings, availability"""
    
    domain_slug = 'real_estate'
    
    def get_listings(self, seller_user) -> List[Dict]:
        """Get all real estate listings for a seller"""
        from listings.models import Listing
        
        # Filter by owner and real_estate category
        listings = Listing.objects.filter(owner=seller_user, category__slug='real_estate')
        return [
            {
                'id': str(l.id),
                'title': l.title,
                'price': float(l.price) if l.price else 0,
                'status': l.status,
                'created_at': l.created_at.isoformat(),
                'image_url': l.images.first().image.url if l.images.exists() else None,
                'location': l.location or '',
                'currency': l.currency,
            }
            for l in listings
        ]
    
    def get_metrics(self, seller_user, period='month') -> Dict[str, Any]:
        """Get real estate metrics for analytics"""
        from listings.models import Listing
        from bookings.models import Booking
        
        start_date = self._get_period_start(period)
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='real_estate')
        
        # Get bookings for listings owned by this user
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            listing__category__slug='real_estate',
            created_at__gte=start_date
        )
        
        total_revenue = sum(
            float(b.total_price) for b in bookings 
            if b.status == 'confirmed' and b.total_price
        )
        confirmed_count = bookings.filter(status='confirmed').count()
        
        return {
            'domain': self.domain_slug,
            'total_listings': listings.count(),
            'active_listings': listings.filter(status='active').count(),
            'total_bookings': bookings.count(),
            'confirmed_bookings': confirmed_count,
            'revenue': total_revenue,
            'booking_rate': confirmed_count / max(bookings.count(), 1),
            'avg_rating': 4.5,  # TODO: Implement rating system
        }
    
    def get_bookings(self, seller_user) -> List[Dict]:
        """Get all real estate bookings for a seller"""
        from bookings.models import Booking
        
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            listing__category__slug='real_estate'
        )
        return [
            {
                'id': str(b.id),
                'title': f"Booking: {b.listing.title}",
                'customer': b.contact_name,
                'status': b.status,
                'created_at': b.created_at.isoformat(),
                'check_in': b.start_date.isoformat() if b.start_date else None,
                'check_out': b.end_date.isoformat() if b.end_date else None,
                'total_price': float(b.total_price) if b.total_price else 0,
                'domain': self.domain_slug,
            }
            for b in bookings.order_by('-created_at')
        ]
    
    def create_listing(self, seller_user, payload: Dict) -> Dict:
        """Create a new real estate listing"""
        from listings.models import Listing, Category
        
        # Get or create real_estate category
        category, _ = Category.objects.get_or_create(
            slug='real_estate',
            defaults={'name': 'Real Estate', 'is_bookable': True}
        )
        
        listing = Listing.objects.create(
            owner=seller_user,
            category=category,
            title=payload.get('title'),
            description=payload.get('description', ''),
            price=payload.get('price'),
            currency=payload.get('currency', 'EUR'),
            status='draft',
            location=payload.get('location', ''),
        )
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
        }
    
    def update_listing(self, seller_user, listing_id: str, payload: Dict) -> Dict:
        """Update an existing real estate listing"""
        from listings.models import Listing
        
        listing = Listing.objects.get(id=listing_id, owner=seller_user, category__slug='real_estate')
        
        # Only allow updating specific fields
        allowed_fields = ['title', 'description', 'price', 'currency', 'status', 'location', 'dynamic_fields']
        for key, value in payload.items():
            if key in allowed_fields and hasattr(listing, key):
                setattr(listing, key, value)
        
        listing.save()
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
        }
    
    def get_listing_detail(self, listing_id: str) -> Dict:
        """Get detailed real estate listing info"""
        from listings.models import Listing
        from bookings.models import Booking
        
        listing = Listing.objects.get(id=listing_id, category__slug='real_estate')
        bookings = Booking.objects.filter(listing=listing)
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price) if listing.price else 0,
            'currency': listing.currency,
            'status': listing.status,
            'location': listing.location or '',
            'total_bookings': bookings.count(),
            'confirmed_bookings': bookings.filter(status='confirmed').count(),
            'revenue': sum(
                float(b.total_price) for b in bookings 
                if b.status == 'confirmed' and b.total_price
            ),
        }
    
    @staticmethod
    def _get_period_start(period: str) -> datetime:
        """Get start date for a period"""
        now = datetime.now()
        if period == 'week':
            return now - timedelta(days=7)
        elif period == 'month':
            return now - timedelta(days=30)
        elif period == 'year':
            return now - timedelta(days=365)
        return now


class EventsDomainService(BaseDomainService):
    """Events domain service - manages events, registrations, ticketing"""
    
    domain_slug = 'events'
    
    def get_listings(self, seller_user) -> List[Dict]:
        """Get all events for a seller"""
        from listings.models import Listing
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='events')
        return [
            {
                'id': str(l.id),
                'title': l.title,
                'price': float(l.price) if l.price else 0,
                'status': l.status,
                'created_at': l.created_at.isoformat(),
                'image_url': l.images.first().image.url if l.images.exists() else None,
                'location': l.location or '',
                'currency': l.currency,
                'event_date': l.dynamic_fields.get('event_date') if l.dynamic_fields else None,
                'capacity': l.dynamic_fields.get('capacity') if l.dynamic_fields else None,
            }
            for l in listings
        ]
    
    def get_metrics(self, seller_user, period='month') -> Dict[str, Any]:
        """Get events metrics for analytics"""
        from listings.models import Listing
        from bookings.models import Booking
        
        start_date = self._get_period_start(period)
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='events')
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            listing__category__slug='events',
            created_at__gte=start_date
        )
        
        total_revenue = sum(
            float(b.total_price) for b in bookings 
            if b.status == 'confirmed' and b.total_price
        )
        confirmed_count = bookings.filter(status='confirmed').count()
        
        return {
            'domain': self.domain_slug,
            'total_listings': listings.count(),
            'active_listings': listings.filter(status='active').count(),
            'total_bookings': bookings.count(),
            'confirmed_bookings': confirmed_count,
            'revenue': total_revenue,
            'booking_rate': confirmed_count / max(bookings.count(), 1),
            'avg_rating': 4.5,
        }
    
    def get_bookings(self, seller_user) -> List[Dict]:
        """Get all event registrations for a seller"""
        from bookings.models import Booking
        
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            listing__category__slug='events'
        )
        return [
            {
                'id': str(b.id),
                'title': f"Registration: {b.listing.title}",
                'customer': b.contact_name,
                'status': b.status,
                'created_at': b.created_at.isoformat(),
                'check_in': b.start_date.isoformat() if b.start_date else None,
                'check_out': b.end_date.isoformat() if b.end_date else None,
                'total_price': float(b.total_price) if b.total_price else 0,
                'domain': self.domain_slug,
                'guests_count': b.guests_count or 1,
            }
            for b in bookings.order_by('-created_at')
        ]
    
    def create_listing(self, seller_user, payload: Dict) -> Dict:
        """Create a new event"""
        from listings.models import Listing, Category
        
        category, _ = Category.objects.get_or_create(
            slug='events',
            defaults={'name': 'Events', 'is_bookable': True}
        )
        
        listing = Listing.objects.create(
            owner=seller_user,
            category=category,
            title=payload.get('title'),
            description=payload.get('description', ''),
            price=payload.get('price'),
            currency=payload.get('currency', 'EUR'),
            status='draft',
            location=payload.get('location', ''),
            dynamic_fields={
                'event_date': payload.get('event_date'),
                'capacity': payload.get('capacity'),
                'event_type': payload.get('event_type', 'general'),
            }
        )
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
        }
    
    def update_listing(self, seller_user, listing_id: str, payload: Dict) -> Dict:
        """Update an existing event"""
        from listings.models import Listing
        
        listing = Listing.objects.get(id=listing_id, owner=seller_user, category__slug='events')
        
        allowed_fields = ['title', 'description', 'price', 'currency', 'status', 'location', 'dynamic_fields']
        for key, value in payload.items():
            if key in allowed_fields and hasattr(listing, key):
                setattr(listing, key, value)
        
        listing.save()
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
        }
    
    def get_listing_detail(self, listing_id: str) -> Dict:
        """Get detailed event info"""
        from listings.models import Listing
        from bookings.models import Booking
        
        listing = Listing.objects.get(id=listing_id, category__slug='events')
        bookings = Booking.objects.filter(listing=listing)
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price) if listing.price else 0,
            'currency': listing.currency,
            'status': listing.status,
            'location': listing.location or '',
            'event_date': listing.dynamic_fields.get('event_date') if listing.dynamic_fields else None,
            'capacity': listing.dynamic_fields.get('capacity') if listing.dynamic_fields else None,
            'total_registrations': bookings.count(),
            'confirmed_registrations': bookings.filter(status='confirmed').count(),
            'revenue': sum(
                float(b.total_price) for b in bookings 
                if b.status == 'confirmed' and b.total_price
            ),
        }


class ActivitiesDomainService(BaseDomainService):
    """Activities domain service - manages tours, experiences, classes"""
    
    domain_slug = 'activities'
    
    def get_listings(self, seller_user) -> List[Dict]:
        """Get all activities for a seller"""
        from listings.models import Listing
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='activities')
        return [
            {
                'id': str(l.id),
                'title': l.title,
                'price': float(l.price) if l.price else 0,
                'status': l.status,
                'created_at': l.created_at.isoformat(),
                'image_url': l.images.first().image.url if l.images.exists() else None,
                'location': l.location or '',
                'currency': l.currency,
                'duration': l.dynamic_fields.get('duration') if l.dynamic_fields else None,
                'difficulty': l.dynamic_fields.get('difficulty') if l.dynamic_fields else None,
            }
            for l in listings
        ]
    
    def get_metrics(self, seller_user, period='month') -> Dict[str, Any]:
        """Get activities metrics for analytics"""
        from listings.models import Listing
        from bookings.models import Booking
        
        start_date = self._get_period_start(period)
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='activities')
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            listing__category__slug='activities',
            created_at__gte=start_date
        )
        
        total_revenue = sum(
            float(b.total_price) for b in bookings 
            if b.status == 'confirmed' and b.total_price
        )
        confirmed_count = bookings.filter(status='confirmed').count()
        
        return {
            'domain': self.domain_slug,
            'total_listings': listings.count(),
            'active_listings': listings.filter(status='active').count(),
            'total_bookings': bookings.count(),
            'confirmed_bookings': confirmed_count,
            'revenue': total_revenue,
            'booking_rate': confirmed_count / max(bookings.count(), 1),
            'avg_rating': 4.5,
        }
    
    def get_bookings(self, seller_user) -> List[Dict]:
        """Get all activity bookings for a seller"""
        from bookings.models import Booking
        
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            listing__category__slug='activities'
        )
        return [
            {
                'id': str(b.id),
                'title': f"Booking: {b.listing.title}",
                'customer': b.contact_name,
                'status': b.status,
                'created_at': b.created_at.isoformat(),
                'check_in': b.start_date.isoformat() if b.start_date else None,
                'check_out': b.end_date.isoformat() if b.end_date else None,
                'total_price': float(b.total_price) if b.total_price else 0,
                'domain': self.domain_slug,
                'guests_count': b.guests_count or 1,
            }
            for b in bookings.order_by('-created_at')
        ]
    
    def create_listing(self, seller_user, payload: Dict) -> Dict:
        """Create a new activity"""
        from listings.models import Listing, Category
        
        category, _ = Category.objects.get_or_create(
            slug='activities',
            defaults={'name': 'Activities', 'is_bookable': True}
        )
        
        listing = Listing.objects.create(
            owner=seller_user,
            category=category,
            title=payload.get('title'),
            description=payload.get('description', ''),
            price=payload.get('price'),
            currency=payload.get('currency', 'EUR'),
            status='draft',
            location=payload.get('location', ''),
            dynamic_fields={
                'duration': payload.get('duration'),
                'difficulty': payload.get('difficulty', 'beginner'),
                'activity_type': payload.get('activity_type', 'tour'),
            }
        )
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
        }
    
    def update_listing(self, seller_user, listing_id: str, payload: Dict) -> Dict:
        """Update an existing activity"""
        from listings.models import Listing
        
        listing = Listing.objects.get(id=listing_id, owner=seller_user, category__slug='activities')
        
        allowed_fields = ['title', 'description', 'price', 'currency', 'status', 'location', 'dynamic_fields']
        for key, value in payload.items():
            if key in allowed_fields and hasattr(listing, key):
                setattr(listing, key, value)
        
        listing.save()
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
        }
    
    def get_listing_detail(self, listing_id: str) -> Dict:
        """Get detailed activity info"""
        from listings.models import Listing
        from bookings.models import Booking
        
        listing = Listing.objects.get(id=listing_id, category__slug='activities')
        bookings = Booking.objects.filter(listing=listing)
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price) if listing.price else 0,
            'currency': listing.currency,
            'status': listing.status,
            'location': listing.location or '',
            'duration': listing.dynamic_fields.get('duration') if listing.dynamic_fields else None,
            'difficulty': listing.dynamic_fields.get('difficulty') if listing.dynamic_fields else None,
            'total_bookings': bookings.count(),
            'confirmed_bookings': bookings.filter(status='confirmed').count(),
            'revenue': sum(
                float(b.total_price) for b in bookings 
                if b.status == 'confirmed' and b.total_price
            ),
        }


class AppointmentsDomainService(BaseDomainService):
    """Appointments domain service - manages salon, spa, service bookings"""
    
    domain_slug = 'appointments'
    
    def get_listings(self, seller_user) -> List[Dict]:
        """Get all appointment services for a seller"""
        from listings.models import Listing
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='appointments')
        return [
            {
                'id': str(l.id),
                'title': l.title,
                'price': float(l.price) if l.price else 0,
                'status': l.status,
                'created_at': l.created_at.isoformat(),
                'image_url': l.images.first().image.url if l.images.exists() else None,
                'location': l.location or '',
                'currency': l.currency,
                'duration_minutes': l.dynamic_fields.get('duration_minutes') if l.dynamic_fields else None,
                'service_type': l.dynamic_fields.get('service_type') if l.dynamic_fields else None,
            }
            for l in listings
        ]
    
    def get_metrics(self, seller_user, period='month') -> Dict[str, Any]:
        """Get appointments metrics for analytics"""
        from listings.models import Listing
        from bookings.models import Booking
        
        start_date = self._get_period_start(period)
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='appointments')
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            listing__category__slug='appointments',
            created_at__gte=start_date
        )
        
        total_revenue = sum(
            float(b.total_price) for b in bookings 
            if b.status == 'confirmed' and b.total_price
        )
        confirmed_count = bookings.filter(status='confirmed').count()
        
        return {
            'domain': self.domain_slug,
            'total_listings': listings.count(),
            'active_listings': listings.filter(status='active').count(),
            'total_bookings': bookings.count(),
            'confirmed_bookings': confirmed_count,
            'revenue': total_revenue,
            'booking_rate': confirmed_count / max(bookings.count(), 1),
            'avg_rating': 4.5,
        }
    
    def get_bookings(self, seller_user) -> List[Dict]:
        """Get all appointment bookings for a seller"""
        from bookings.models import Booking
        
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            listing__category__slug='appointments'
        )
        return [
            {
                'id': str(b.id),
                'title': f"Appointment: {b.listing.title}",
                'customer': b.contact_name,
                'status': b.status,
                'created_at': b.created_at.isoformat(),
                'check_in': b.start_date.isoformat() if b.start_date else None,
                'check_out': b.end_date.isoformat() if b.end_date else None,
                'total_price': float(b.total_price) if b.total_price else 0,
                'domain': self.domain_slug,
            }
            for b in bookings.order_by('-created_at')
        ]
    
    def create_listing(self, seller_user, payload: Dict) -> Dict:
        """Create a new appointment service"""
        from listings.models import Listing, Category
        
        category, _ = Category.objects.get_or_create(
            slug='appointments',
            defaults={'name': 'Appointments', 'is_bookable': True}
        )
        
        listing = Listing.objects.create(
            owner=seller_user,
            category=category,
            title=payload.get('title'),
            description=payload.get('description', ''),
            price=payload.get('price'),
            currency=payload.get('currency', 'EUR'),
            status='draft',
            location=payload.get('location', ''),
            dynamic_fields={
                'duration_minutes': payload.get('duration_minutes', 60),
                'service_type': payload.get('service_type', 'general'),
                'requires_confirmation': payload.get('requires_confirmation', True),
            }
        )
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
        }
    
    def update_listing(self, seller_user, listing_id: str, payload: Dict) -> Dict:
        """Update an existing appointment service"""
        from listings.models import Listing
        
        listing = Listing.objects.get(id=listing_id, owner=seller_user, category__slug='appointments')
        
        allowed_fields = ['title', 'description', 'price', 'currency', 'status', 'location', 'dynamic_fields']
        for key, value in payload.items():
            if key in allowed_fields and hasattr(listing, key):
                setattr(listing, key, value)
        
        listing.save()
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
        }
    
    def get_listing_detail(self, listing_id: str) -> Dict:
        """Get detailed appointment service info"""
        from listings.models import Listing
        from bookings.models import Booking
        
        listing = Listing.objects.get(id=listing_id, category__slug='appointments')
        bookings = Booking.objects.filter(listing=listing)
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price) if listing.price else 0,
            'currency': listing.currency,
            'status': listing.status,
            'location': listing.location or '',
            'duration_minutes': listing.dynamic_fields.get('duration_minutes') if listing.dynamic_fields else None,
            'service_type': listing.dynamic_fields.get('service_type') if listing.dynamic_fields else None,
            'total_bookings': bookings.count(),
            'confirmed_bookings': bookings.filter(status='confirmed').count(),
            'revenue': sum(
                float(b.total_price) for b in bookings 
                if b.status == 'confirmed' and b.total_price
            ),
        }
