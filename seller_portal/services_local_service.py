"""
Services Domain Service - manages local services (plumber, lawyer, cleaner, etc.)
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
from seller_portal.base_domain_service import BaseDomainService


class ServicesDomainService(BaseDomainService):
    """Services domain service - manages local services (plumber, lawyer, cleaner, etc.)"""
    
    domain_slug = 'services'
    
    def get_listings(self, seller_user) -> List[Dict]:
        """Get all service listings for a seller"""
        from listings.models import Listing
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='services')
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
                'service_type': l.dynamic_fields.get('service_type') if l.dynamic_fields else None,
                'availability': l.dynamic_fields.get('availability') if l.dynamic_fields else None,
            }
            for l in listings
        ]
    
    def get_metrics(self, seller_user, period='month') -> Dict[str, Any]:
        """Get service metrics for analytics"""
        from listings.models import Listing
        from bookings.models import Booking
        
        start_date = self._get_period_start(period)
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='services')
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            listing__category__slug='services',
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
        """Get all service bookings for a seller"""
        from bookings.models import Booking
        
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            listing__category__slug='services'
        )
        return [
            {
                'id': str(b.id),
                'title': f"Service: {b.listing.title}",
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
        """Create a new service listing"""
        from listings.models import Listing, Category
        
        category, _ = Category.objects.get_or_create(
            slug='services',
            defaults={'name': 'Services', 'is_bookable': True}
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
                'service_type': payload.get('service_type'),
                'availability': payload.get('availability'),
                'response_time': payload.get('response_time'),
            }
        )
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
        }
    
    def update_listing(self, seller_user, listing_id: str, payload: Dict) -> Dict:
        """Update an existing service listing"""
        from listings.models import Listing
        
        listing = Listing.objects.get(id=listing_id, owner=seller_user, category__slug='services')
        
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
        """Get detailed service listing info"""
        from listings.models import Listing
        from bookings.models import Booking
        
        listing = Listing.objects.get(id=listing_id, category__slug='services')
        bookings = Booking.objects.filter(listing=listing)
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price) if listing.price else 0,
            'currency': listing.currency,
            'status': listing.status,
            'location': listing.location or '',
            'service_type': listing.dynamic_fields.get('service_type') if listing.dynamic_fields else None,
            'availability': listing.dynamic_fields.get('availability') if listing.dynamic_fields else None,
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
