"""
Seller Portal API endpoints - unified orchestration across all business domains.
"""

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from users.models import BusinessProfile, BusinessDomain
from .services import (
    RealEstateDomainService,
    EventsDomainService,
    ActivitiesDomainService,
    AppointmentsDomainService,
)
from .vehicles_service import VehiclesDomainService
from .products_service import ProductsDomainService
from .services_local_service import ServicesDomainService
from .restaurants_service import RestaurantsDomainService
from .p2p_service import P2PDomainService
from .analytics import AnalyticsService


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_domains(request):
    """
    GET /api/seller/domains/
    Get user's active business domains for personalized dashboard
    """
    try:
        # Get user's business domains
        domains = BusinessDomain.objects.filter(
            user=request.user,
            is_active=True
        ).order_by('-is_primary', '-total_revenue')
        
        # Serialize domains
        domains_data = [domain.to_dict() for domain in domains]
        
        # Get available domains for "Add Domain" feature
        user_domain_slugs = set(domain.domain for domain in domains)
        available_domains = [
            {
                'domain': choice[0],
                'name': choice[1],
                'config': BusinessDomain(domain=choice[0]).dashboard_config
            }
            for choice in BusinessDomain.DOMAIN_CHOICES
            if choice[0] not in user_domain_slugs
        ]
        
        return Response({
            'user_domains': domains_data,
            'available_domains': available_domains,
            'has_primary_domain': any(d.is_primary for d in domains),
            'total_domains': len(domains_data)
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to fetch user domains: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_domain(request):
    """
    POST /api/seller/domains/add/
    Add a new business domain for the user
    """
    try:
        domain_slug = request.data.get('domain')
        is_primary = request.data.get('is_primary', False)
        
        if not domain_slug:
            return Response({
                'error': 'Domain is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate domain choice
        valid_domains = [choice[0] for choice in BusinessDomain.DOMAIN_CHOICES]
        if domain_slug not in valid_domains:
            return Response({
                'error': f'Invalid domain. Choose from: {valid_domains}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already has this domain
        existing_domain = BusinessDomain.objects.filter(
            user=request.user,
            domain=domain_slug
        ).first()
        
        if existing_domain:
            if existing_domain.is_active:
                return Response({
                    'error': 'Domain already exists and is active'
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Reactivate existing domain
                existing_domain.is_active = True
                existing_domain.is_primary = is_primary
                existing_domain.save()
                return Response({
                    'message': 'Domain reactivated successfully',
                    'domain': existing_domain.to_dict()
                })
        
        # If this is the first domain, make it primary
        user_domains_count = BusinessDomain.objects.filter(
            user=request.user,
            is_active=True
        ).count()
        
        if user_domains_count == 0:
            is_primary = True
        
        # If setting as primary, unset other primary domains
        if is_primary:
            BusinessDomain.objects.filter(
                user=request.user,
                is_primary=True
            ).update(is_primary=False)
        
        # Create new domain
        new_domain = BusinessDomain.objects.create(
            user=request.user,
            domain=domain_slug,
            is_primary=is_primary,
            is_active=True
        )
        
        return Response({
            'message': 'Domain added successfully',
            'domain': new_domain.to_dict()
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to add domain: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_domain(request, domain_id):
    """
    DELETE /api/seller/domains/<domain_id>/
    Remove/deactivate a business domain
    """
    try:
        domain = get_object_or_404(
            BusinessDomain,
            id=domain_id,
            user=request.user
        )
        
        # Don't allow removing the last active domain
        active_domains_count = BusinessDomain.objects.filter(
            user=request.user,
            is_active=True
        ).count()
        
        if active_domains_count <= 1:
            return Response({
                'error': 'Cannot remove the last active domain'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # If removing primary domain, set another as primary
        if domain.is_primary:
            next_primary = BusinessDomain.objects.filter(
                user=request.user,
                is_active=True
            ).exclude(id=domain.id).first()
            
            if next_primary:
                next_primary.is_primary = True
                next_primary.save()
        
        # Deactivate domain (soft delete)
        domain.is_active = False
        domain.save()
        
        return Response({
            'message': 'Domain removed successfully'
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to remove domain: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _get_domain_service(domain_slug: str):
    """Factory to get appropriate domain service"""
    services = {
        'real_estate': RealEstateDomainService,
        'events': EventsDomainService,
        'activities': ActivitiesDomainService,
        'appointments': AppointmentsDomainService,
        'vehicles': VehiclesDomainService,
        'products': ProductsDomainService,
        'services': ServicesDomainService,
        'restaurants': RestaurantsDomainService,
        'p2p': P2PDomainService,
    }
    
    service_class = services.get(domain_slug)
    if not service_class:
        raise ValueError(f"Unknown domain: {domain_slug}")
    
    return service_class()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_overview(request):
    """
    GET /api/seller/overview/
    Personalized dashboard overview for user's active domains only.
    
    Returns:
        {
            'business_id': 'uuid',
            'business_name': 'My Business',
            'total_listings': 10,
            'total_bookings': 25,
            'total_revenue': 5000.00,
            'user_domains': ['real_estate', 'events'],
            'domains': [
                {
                    'domain': 'real_estate',
                    'total_listings': 5,
                    'active_listings': 4,
                    'total_bookings': 12,
                    'confirmed_bookings': 10,
                    'revenue': 3000.00,
                    'booking_rate': 0.83,
                }
            ]
        }
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get user's active business domains
    user_domains = BusinessDomain.objects.filter(
        user=request.user,
        is_active=True
    ).order_by('-is_primary', '-total_revenue')
    
    # If no domains exist, create default real estate domain
    if not user_domains.exists():
        default_domain = BusinessDomain.objects.create(
            user=request.user,
            domain='real_estate',
            is_primary=True,
            is_active=True
        )
        user_domains = [default_domain]
    
    active_domains = [domain.domain for domain in user_domains]
    
    overview = {
        'business_id': str(business.id),
        'business_name': business.business_name,
        'total_listings': 0,
        'total_bookings': 0,
        'total_revenue': 0.0,
        'user_domains': active_domains,
        'domains': [],
    }
    
    for domain_slug in active_domains:
        try:
            service = _get_domain_service(domain_slug)
            metrics = service.get_metrics(request.user)
            
            overview['domains'].append(metrics)
            overview['total_listings'] += metrics.get('total_listings', 0)
            overview['total_bookings'] += metrics.get('total_bookings', 0)
            overview['total_revenue'] += metrics.get('revenue', 0.0)
        except Exception as e:
            # Log error but continue with other domains
            print(f"Error getting metrics for {domain_slug}: {str(e)}")
            continue
    
    return Response(overview)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_listings(request):
    """
    GET /api/seller/listings/?domain=real_estate
    Unified listings across all domains, optionally filtered by domain.
    
    Returns:
        [
            {
                'id': 'uuid',
                'title': 'Listing Title',
                'domain': 'real_estate',
                'status': 'active',
                'price': 100.00,
                'created_at': '2025-11-12T...',
                ...
            }
        ]
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    filter_domain = request.query_params.get('domain')
    active_domains = business.get_active_domains() if hasattr(business, 'get_active_domains') else ['real_estate']
    
    listings = []
    
    for domain_slug in active_domains:
        if filter_domain and filter_domain != domain_slug:
            continue
        
        try:
            service = _get_domain_service(domain_slug)
            domain_listings = service.get_listings(request.user)
            
            for listing in domain_listings:
                listing['domain'] = domain_slug
            
            listings.extend(domain_listings)
        except Exception as e:
            print(f"Error getting listings for {domain_slug}: {str(e)}")
            continue
    
    return Response(listings)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_bookings(request):
    """
    GET /api/seller/bookings/?status=pending
    Unified bookings across all domains.
    
    Returns:
        [
            {
                'id': 'uuid',
                'title': 'Booking Title',
                'domain': 'real_estate',
                'customer': 'Customer Name',
                'status': 'confirmed',
                'created_at': '2025-11-12T...',
                'total_price': 500.00,
                ...
            }
        ]
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    status_filter = request.query_params.get('status')
    active_domains = business.get_active_domains() if hasattr(business, 'get_active_domains') else ['real_estate']
    
    bookings = []
    
    for domain_slug in active_domains:
        try:
            service = _get_domain_service(domain_slug)
            domain_bookings = service.get_bookings(request.user)
            
            if status_filter:
                domain_bookings = [b for b in domain_bookings if b.get('status') == status_filter]
            
            bookings.extend(domain_bookings)
        except Exception as e:
            print(f"Error getting bookings for {domain_slug}: {str(e)}")
            continue
    
    # Sort by most recent
    bookings.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return Response(bookings)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listing_detail(request, listing_id):
    """
    GET /api/seller/listings/{listing_id}/
    Get detailed info for a specific listing.
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    domain = request.query_params.get('domain', 'real_estate')
    
    try:
        service = _get_domain_service(domain)
        listing = service.get_listing_detail(listing_id)
        return Response(listing)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_listing(request):
    """
    POST /api/seller/listings/
    Create a new listing in a domain.
    
    Body:
        {
            'domain': 'real_estate',
            'title': 'Beautiful House',
            'description': '...',
            'price': 100.00,
            ...
        }
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    domain = request.data.get('domain', 'real_estate')
    
    try:
        service = _get_domain_service(domain)
        listing = service.create_listing(request.user, request.data)
        return Response(listing, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_listing(request, listing_id):
    """
    PUT/PATCH /api/seller/listings/{listing_id}/
    Update an existing listing.
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    domain = request.query_params.get('domain', 'real_estate')
    
    try:
        service = _get_domain_service(domain)
        listing = service.update_listing(request.user, listing_id, request.data)
        return Response(listing)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_revenue(request):
    """
    GET /api/seller/analytics/revenue/
    Get revenue breakdown by domain.
    
    Query params:
        period: 'week', 'month', 'quarter', 'year' (default: 'month')
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    period = request.query_params.get('period', 'month')
    analytics = AnalyticsService.get_revenue_by_domain(request.user, period)
    return Response(analytics)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_trends(request):
    """
    GET /api/seller/analytics/trends/
    Get booking trends over time.
    
    Query params:
        period: 'week', 'month', 'quarter', 'year' (default: 'month')
        interval: 'daily', 'weekly', 'monthly' (default: 'daily')
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    period = request.query_params.get('period', 'month')
    interval = request.query_params.get('interval', 'daily')
    analytics = AnalyticsService.get_booking_trends(request.user, period, interval)
    return Response(analytics)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_top_listings(request):
    """
    GET /api/seller/analytics/top-listings/
    Get top performing listings by bookings and revenue.
    
    Query params:
        limit: number of listings to return (default: 10)
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    limit = int(request.query_params.get('limit', 10))
    listings = AnalyticsService.get_top_listings(request.user, limit)
    return Response({'listings': listings})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_conversion(request):
    """
    GET /api/seller/analytics/conversion/
    Get conversion and performance metrics.
    
    Query params:
        period: 'week', 'month', 'quarter', 'year' (default: 'month')
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    period = request.query_params.get('period', 'month')
    analytics = AnalyticsService.get_conversion_metrics(request.user, period)
    return Response(analytics)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_customers(request):
    """
    GET /api/seller/analytics/customers/
    Get customer insights and top customers.
    
    Query params:
        limit: number of top customers to return (default: 10)
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    limit = int(request.query_params.get('limit', 10))
    insights = AnalyticsService.get_customer_insights(request.user, limit)
    return Response(insights)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_availability(request):
    """
    GET /api/seller/analytics/availability/
    Get listing availability and utilization analysis.
    """
    try:
        business = request.user.business_profile
        if not business:
            return Response(
                {"error": "User is not a business account"},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {"error": "User is not a business account"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    analysis = AnalyticsService.get_availability_analysis(request.user)
    return Response(analysis)
