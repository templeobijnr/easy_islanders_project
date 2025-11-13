"""
Base domain service interface for multi-domain orchestration.

Each domain (real_estate, events, activities, appointments) implements
this interface to provide consistent contracts for the seller portal.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseDomainService(ABC):
    """
    Abstract service that each domain implements to provide consistent contracts.
    
    This enables the seller portal to aggregate data and operations across
    different business domains without tight coupling.
    """
    
    domain_slug: str  # 'real_estate', 'events', 'activities', etc.
    
    @abstractmethod
    def get_listings(self, seller_user) -> List[Dict]:
        """
        Return all listings for a seller in this domain.
        
        Returns:
            List of dicts with keys: id, title, status, created_at, image_url, price, etc.
        """
        pass
    
    @abstractmethod
    def get_metrics(self, seller_user, period='month') -> Dict[str, Any]:
        """
        Return domain-specific metrics for analytics.
        
        Returns:
            {
                'domain': 'real_estate',
                'total_listings': 5,
                'active_listings': 4,
                'total_bookings': 12,
                'confirmed_bookings': 10,
                'booking_rate': 0.85,
                'revenue': 1200.00,
                'avg_rating': 4.7,
            }
        """
        pass
    
    @abstractmethod
    def get_bookings(self, seller_user) -> List[Dict]:
        """
        Return all bookings/reservations in this domain.
        
        Returns:
            List of dicts with keys: id, title, customer, status, created_at, etc.
        """
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
