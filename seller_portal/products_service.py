"""
Products Domain Service - manages retail items (not bookable)
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
from seller_portal.base_domain_service import BaseDomainService


class ProductsDomainService(BaseDomainService):
    """Products domain service - manages retail items (not bookable)"""
    
    domain_slug = 'products'
    
    def get_listings(self, seller_user) -> List[Dict]:
        """Get all product listings for a seller"""
        from listings.models import Listing
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='products')
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
                'stock': l.dynamic_fields.get('stock') if l.dynamic_fields else 0,
                'category_type': l.dynamic_fields.get('category_type') if l.dynamic_fields else None,
            }
            for l in listings
        ]
    
    def get_metrics(self, seller_user, period='month') -> Dict[str, Any]:
        """Get product metrics for analytics"""
        from listings.models import Listing
        
        listings = Listing.objects.filter(owner=seller_user, category__slug='products')
        
        return {
            'domain': self.domain_slug,
            'total_listings': listings.count(),
            'active_listings': listings.filter(status='active').count(),
            'total_bookings': 0,
            'confirmed_bookings': 0,
            'revenue': 0.0,
            'booking_rate': 0.0,
            'avg_rating': 4.5,
        }
    
    def get_bookings(self, seller_user) -> List[Dict]:
        """Products are not bookable - return empty list"""
        return []
    
    def create_listing(self, seller_user, payload: Dict) -> Dict:
        """Create a new product listing"""
        from listings.models import Listing, Category
        
        category, _ = Category.objects.get_or_create(
            slug='products',
            defaults={'name': 'Products', 'is_bookable': False}
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
                'stock': payload.get('stock', 0),
                'category_type': payload.get('category_type'),
                'sku': payload.get('sku'),
            }
        )
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
        }
    
    def update_listing(self, seller_user, listing_id: str, payload: Dict) -> Dict:
        """Update an existing product listing"""
        from listings.models import Listing
        
        listing = Listing.objects.get(id=listing_id, owner=seller_user, category__slug='products')
        
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
        """Get detailed product listing info"""
        from listings.models import Listing
        
        listing = Listing.objects.get(id=listing_id, category__slug='products')
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price) if listing.price else 0,
            'currency': listing.currency,
            'status': listing.status,
            'location': listing.location or '',
            'stock': listing.dynamic_fields.get('stock') if listing.dynamic_fields else 0,
            'category_type': listing.dynamic_fields.get('category_type') if listing.dynamic_fields else None,
            'sku': listing.dynamic_fields.get('sku') if listing.dynamic_fields else None,
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
