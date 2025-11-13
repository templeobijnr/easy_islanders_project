"""
Analytics service for cross-domain insights and reporting
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone


class AnalyticsService:
    """Cross-domain analytics and insights"""
    
    @staticmethod
    def get_revenue_by_domain(seller_user, period='month') -> Dict[str, Any]:
        """Get revenue breakdown by domain"""
        from bookings.models import Booking
        
        start_date = AnalyticsService._get_period_start(period)
        
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            status='confirmed',
            created_at__gte=start_date
        )
        
        # Group by domain
        domains_data = {}
        for booking in bookings:
            domain = booking.listing.category.slug if booking.listing.category else 'unknown'
            if domain not in domains_data:
                domains_data[domain] = {
                    'domain': domain,
                    'revenue': 0.0,
                    'bookings': 0,
                    'avg_booking_value': 0.0,
                }
            
            domains_data[domain]['revenue'] += float(booking.total_price)
            domains_data[domain]['bookings'] += 1
        
        # Calculate averages
        for domain_data in domains_data.values():
            if domain_data['bookings'] > 0:
                domain_data['avg_booking_value'] = domain_data['revenue'] / domain_data['bookings']
        
        return {
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': timezone.now().isoformat(),
            'total_revenue': sum(d['revenue'] for d in domains_data.values()),
            'total_bookings': sum(d['bookings'] for d in domains_data.values()),
            'domains': list(domains_data.values()),
        }
    
    @staticmethod
    def get_booking_trends(seller_user, period='month', interval='daily') -> Dict[str, Any]:
        """Get booking trends over time"""
        from bookings.models import Booking
        
        start_date = AnalyticsService._get_period_start(period)
        
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            created_at__gte=start_date
        ).order_by('created_at')
        
        # Group by interval
        trends = {}
        for booking in bookings:
            if interval == 'daily':
                key = booking.created_at.date().isoformat()
            elif interval == 'weekly':
                key = booking.created_at.isocalendar()[1]
            elif interval == 'monthly':
                key = booking.created_at.strftime('%Y-%m')
            else:
                key = booking.created_at.date().isoformat()
            
            if key not in trends:
                trends[key] = {
                    'period': key,
                    'total_bookings': 0,
                    'confirmed_bookings': 0,
                    'revenue': 0.0,
                }
            
            trends[key]['total_bookings'] += 1
            if booking.status == 'confirmed':
                trends[key]['confirmed_bookings'] += 1
                trends[key]['revenue'] += float(booking.total_price)
        
        return {
            'period': period,
            'interval': interval,
            'trends': list(trends.values()),
        }
    
    @staticmethod
    def get_top_listings(seller_user, limit=10) -> List[Dict[str, Any]]:
        """Get top performing listings by bookings"""
        from listings.models import Listing
        from bookings.models import Booking
        
        listings = Listing.objects.filter(owner=seller_user).prefetch_related('bookings')
        
        listings_data = []
        for listing in listings:
            bookings = listing.bookings.filter(status='confirmed')
            revenue = sum(float(b.total_price) for b in bookings)
            
            listings_data.append({
                'id': str(listing.id),
                'title': listing.title,
                'domain': listing.category.slug if listing.category else 'unknown',
                'bookings': bookings.count(),
                'revenue': revenue,
                'avg_booking_value': revenue / max(bookings.count(), 1),
                'status': listing.status,
                'created_at': listing.created_at.isoformat(),
            })
        
        # Sort by revenue and return top N
        listings_data.sort(key=lambda x: x['revenue'], reverse=True)
        return listings_data[:limit]
    
    @staticmethod
    def get_conversion_metrics(seller_user, period='month') -> Dict[str, Any]:
        """Get conversion and performance metrics"""
        from listings.models import Listing
        from bookings.models import Booking
        
        start_date = AnalyticsService._get_period_start(period)
        
        listings = Listing.objects.filter(
            owner=seller_user,
            created_at__gte=start_date
        )
        
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            created_at__gte=start_date
        )
        
        confirmed_bookings = bookings.filter(status='confirmed')
        pending_bookings = bookings.filter(status='pending')
        cancelled_bookings = bookings.filter(status='cancelled')
        
        total_bookings = bookings.count()
        conversion_rate = (confirmed_bookings.count() / max(total_bookings, 1)) * 100
        cancellation_rate = (cancelled_bookings.count() / max(total_bookings, 1)) * 100
        
        return {
            'period': period,
            'total_listings': listings.count(),
            'total_bookings': total_bookings,
            'confirmed_bookings': confirmed_bookings.count(),
            'pending_bookings': pending_bookings.count(),
            'cancelled_bookings': cancelled_bookings.count(),
            'conversion_rate': round(conversion_rate, 2),
            'cancellation_rate': round(cancellation_rate, 2),
            'avg_bookings_per_listing': round(total_bookings / max(listings.count(), 1), 2),
        }
    
    @staticmethod
    def get_customer_insights(seller_user, limit=10) -> Dict[str, Any]:
        """Get insights about customers"""
        from bookings.models import Booking
        
        bookings = Booking.objects.filter(
            listing__owner=seller_user,
            status='confirmed'
        )
        
        # Group by customer
        customers = {}
        for booking in bookings:
            customer_email = booking.contact_email
            if customer_email not in customers:
                customers[customer_email] = {
                    'email': customer_email,
                    'name': booking.contact_name,
                    'bookings': 0,
                    'total_spent': 0.0,
                    'last_booking': None,
                }
            
            customers[customer_email]['bookings'] += 1
            customers[customer_email]['total_spent'] += float(booking.total_price)
            customers[customer_email]['last_booking'] = booking.created_at.isoformat()
        
        # Sort by total spent and return top N
        customers_list = list(customers.values())
        customers_list.sort(key=lambda x: x['total_spent'], reverse=True)
        
        return {
            'total_unique_customers': len(customers),
            'top_customers': customers_list[:limit],
            'avg_customer_value': sum(c['total_spent'] for c in customers_list) / max(len(customers_list), 1),
            'repeat_customer_rate': round(
                sum(1 for c in customers_list if c['bookings'] > 1) / max(len(customers_list), 1) * 100,
                2
            ),
        }
    
    @staticmethod
    def get_availability_analysis(seller_user) -> Dict[str, Any]:
        """Analyze listing availability and utilization"""
        from listings.models import Listing
        from bookings.models import Booking
        
        listings = Listing.objects.filter(owner=seller_user, status='active')
        
        availability_data = []
        for listing in listings:
            bookings = Booking.objects.filter(
                listing=listing,
                status__in=['confirmed', 'in_progress']
            )
            
            # Calculate utilization (simplified - assumes 30 day month)
            utilization_rate = (bookings.count() / 30) * 100
            
            availability_data.append({
                'listing_id': str(listing.id),
                'title': listing.title,
                'domain': listing.category.slug if listing.category else 'unknown',
                'booked_days': bookings.count(),
                'utilization_rate': round(min(utilization_rate, 100), 2),
                'available_days': max(0, 30 - bookings.count()),
            })
        
        return {
            'total_active_listings': listings.count(),
            'avg_utilization_rate': round(
                sum(d['utilization_rate'] for d in availability_data) / max(len(availability_data), 1),
                2
            ),
            'listings': availability_data,
        }
    
    @staticmethod
    def _get_period_start(period: str) -> datetime:
        """Get start date for a period"""
        now = timezone.now()
        if period == 'week':
            return now - timedelta(days=7)
        elif period == 'month':
            return now - timedelta(days=30)
        elif period == 'quarter':
            return now - timedelta(days=90)
        elif period == 'year':
            return now - timedelta(days=365)
        return now
