"""
Portfolio API views for Real Estate v1.

Provides endpoints for:
1. Portfolio listings list with filtering and pagination
2. Portfolio summary with aggregated stats per listing type
3. Listing update via PATCH
"""
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView

from real_estate.models import Listing, ListingType, ListingEvent, PropertyImage
from .portfolio_serializers import (
    PortfolioListingSerializer,
    PortfolioSummaryItemSerializer,
    ListingUpdateSerializer,
    PropertyImageSerializer,
    ListingDetailSerializer,
)


class PortfolioViewSet(viewsets.ViewSet):
    """
    Portfolio API for managing real estate listings.

    Endpoints:
    - GET /api/v1/real_estate/portfolio/listings/ - List listings with filters
    - GET /api/v1/real_estate/portfolio/summary/ - Get summary stats
    - PATCH /api/v1/real_estate/listings/:id/ - Update listing
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='listings')
    def listings(self, request):
        """
        GET /api/v1/real_estate/portfolio/listings/

        Query Parameters:
            - listing_type (str): Filter by listing type code (e.g., "DAILY_RENTAL")
            - status (str): Filter by status (e.g., "ACTIVE")
            - city (str): Filter by city name
            - area (str): Filter by area name
            - search (str): Search in title, reference_code, description
            - page (int): Page number (default: 1)
            - page_size (int): Items per page (default: 20)

        Response:
            {
                "results": [PortfolioListing, ...],
                "page": int,
                "page_size": int,
                "total": int
            }
        """
        # Extract query parameters
        listing_type_code = request.query_params.get('listing_type')
        status_filter = request.query_params.get('status')
        city_filter = request.query_params.get('city')
        area_filter = request.query_params.get('area')
        search_query = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Base queryset
        qs = Listing.objects.select_related(
            'listing_type',
            'property',
            'property__location',
            'property__property_type'
        ).prefetch_related(
            'property__features',
            'events'
        ).all()

        # Apply filters
        if listing_type_code and listing_type_code != 'ALL':
            qs = qs.filter(listing_type__code=listing_type_code)

        if status_filter and status_filter != 'ALL':
            qs = qs.filter(status=status_filter)

        if city_filter:
            qs = qs.filter(property__location__city__iexact=city_filter)

        if area_filter:
            qs = qs.filter(property__location__area__iexact=area_filter)

        if search_query:
            qs = qs.filter(
                Q(title__icontains=search_query) |
                Q(reference_code__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        # Count total before pagination
        total = qs.count()

        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        qs = qs[start:end]

        # Serialize
        serializer = PortfolioListingSerializer(qs, many=True)

        return Response({
            'results': serializer.data,
            'page': page,
            'page_size': page_size,
            'total': total,
        })

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """
        GET /api/v1/real_estate/portfolio/summary/

        Response:
            [
                {
                    "listing_type": "DAILY_RENTAL",
                    "total_listings": int,
                    "active_listings": int,
                    "occupied_units": int | null,
                    "vacant_units": int | null,
                    "avg_price": str | null,
                    "views_30d": int,
                    "enquiries_30d": int,
                    "bookings_30d": int
                },
                ...
            ]
        """
        thirty_days_ago = timezone.now() - timedelta(days=30)

        # Get all listing types
        listing_types = ListingType.objects.all()

        summary = []
        for lt in listing_types:
            # Count listings
            total = Listing.objects.filter(listing_type=lt).count()
            active = Listing.objects.filter(listing_type=lt, status='ACTIVE').count()

            # Get listing IDs for this type
            listing_ids = Listing.objects.filter(listing_type=lt).values_list('id', flat=True)

            # Count events in last 30 days
            views = ListingEvent.objects.filter(
                listing_id__in=listing_ids,
                event_type='VIEW',
                occurred_at__gte=thirty_days_ago
            ).count()

            enquiries = ListingEvent.objects.filter(
                listing_id__in=listing_ids,
                event_type='ENQUIRY',
                occurred_at__gte=thirty_days_ago
            ).count()

            bookings = ListingEvent.objects.filter(
                listing_id__in=listing_ids,
                event_type='BOOKING_CONFIRMED',
                occurred_at__gte=thirty_days_ago
            ).count()

            # Calculate occupancy metrics (only for rental types)
            occupied = None
            vacant = None
            if lt.code in ['DAILY_RENTAL', 'LONG_TERM_RENTAL']:
                occupied = Listing.objects.filter(
                    listing_type=lt,
                    status__in=['ACTIVE', 'RENTED']
                ).count()
                vacant = Listing.objects.filter(
                    listing_type=lt,
                    status='ACTIVE'
                ).exclude(status='RENTED').count()

            # Calculate average price
            from django.db.models import Avg
            avg_price_val = Listing.objects.filter(
                listing_type=lt,
                status='ACTIVE'
            ).aggregate(avg=Avg('base_price'))['avg']
            avg_price = str(avg_price_val) if avg_price_val else None

            summary.append({
                'listing_type': lt.code,
                'total_listings': total,
                'active_listings': active,
                'occupied_units': occupied,
                'vacant_units': vacant,
                'avg_price': avg_price,
                'views_30d': views,
                'enquiries_30d': enquiries,
                'bookings_30d': bookings,
            })

        serializer = PortfolioSummaryItemSerializer(summary, many=True)
        return Response(serializer.data)


class ListingViewSet(viewsets.ModelViewSet):
    """
    Listing CRUD API.

    Endpoints:
    - PATCH /api/v1/real_estate/listings/:id/ - Update listing
    """

    permission_classes = [IsAuthenticated]
    queryset = Listing.objects.all()
    serializer_class = ListingUpdateSerializer
    # Allow POST for custom actions like upload_image while keeping core endpoints GET/PATCH-only
    http_method_names = ['get', 'patch', 'post']

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list':
            return PortfolioListingSerializer
        if self.action == 'retrieve':
            return ListingDetailSerializer
        return ListingUpdateSerializer

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH /api/v1/real_estate/listings/:id/

        Request Body:
            {
                "base_price": "1200.00",
                "currency": "EUR",
                "status": "ACTIVE",
                "available_from": "2025-01-01",
                "available_to": "2025-12-31",
                "title": "Updated Title",
                "description": "Updated description"
            }

        Response:
            {
                "id": int,
                "reference_code": "...",
                ...
            }
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Return full listing data
        response_serializer = PortfolioListingSerializer(instance)
        return Response(response_serializer.data)

    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        """
        POST /api/listings/:id/upload-image/

        Upload an image for a listing.

        Expects multipart/form-data with:
            - image: ImageField (required)
            - caption: String (optional)
            - display_order: Integer (optional)

        Response:
            {
                "id": int,
                "image": "url",
                "url": "full_url",
                "caption": "...",
                "display_order": int,
                "uploaded_at": "timestamp"
            }
        """
        listing = self.get_object()

        # Check if image file is provided
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {"error": "No image file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get optional fields
        caption = request.data.get('caption', '')
        display_order = request.data.get('display_order', 0)

        # Create PropertyImage instance
        property_image = PropertyImage.objects.create(
            listing=listing,
            property=listing.property,  # Also link to property if available
            image=image_file,
            caption=caption,
            display_order=display_order
        )

        # Serialize and return
        serializer = PropertyImageSerializer(property_image, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='images', permission_classes=[AllowAny])
    def images(self, request, pk=None):
        """
        GET /api/listings/:id/images/

        Get all images for a listing.

        Response:
            {
                "listing_id": int,
                "images": [...],
                "image_count": int
            }
        """
        listing = self.get_object()
        images = PropertyImage.objects.filter(listing=listing).order_by('display_order', 'uploaded_at')

        serializer = PropertyImageSerializer(images, many=True, context={'request': request})

        return Response({
            "listing_id": listing.id,
            "images": serializer.data,
            "image_count": images.count()
        })


class PortfolioInsightsView(APIView):
    """
    GET /api/v1/real_estate/portfolio/insights/?time_period=30d
    
    Auto-generate insights based on portfolio performance.
    Returns actionable recommendations for improving listings.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        time_period = request.query_params.get('time_period', '30d')
        
        # Parse time period
        if time_period == '30d':
            days = 30
        elif time_period == '90d':
            days = 90
        elif time_period == '1y':
            days = 365
        else:
            days = 30
        
        period_start = timezone.now() - timedelta(days=days)
        
        # Get user's listings
        user_listings = Listing.objects.filter(created_by=request.user)
        
        insights = []
        
        # 1. Occupancy Rate Insight (for rentals)
        rental_listings = user_listings.filter(
            listing_type__code__in=['DAILY_RENTAL', 'LONG_TERM_RENTAL']
        )
        if rental_listings.exists():
            total_rentals = rental_listings.count()
            active_rentals = rental_listings.filter(status='ACTIVE').count()
            occupancy_rate = (active_rentals / total_rentals * 100) if total_rentals > 0 else 0
            
            if occupancy_rate > 75:
                insights.append({
                    'id': f'occupancy-high-{timezone.now().strftime("%Y-%m")}',
                    'type': 'positive',
                    'title': f'Excellent occupancy rate at {occupancy_rate:.1f}%',
                    'description': f'Your {total_rentals} rental properties are performing above the industry average of 60-70%.',
                    'priority': 1,
                    'category': 'performance',
                    'metadata': {
                        'metric': 'occupancy',
                        'value': occupancy_rate,
                        'total_listings': total_rentals
                    }
                })
            elif occupancy_rate < 50:
                insights.append({
                    'id': f'occupancy-low-{timezone.now().strftime("%Y-%m")}',
                    'type': 'warning',
                    'title': f'Low occupancy rate at {occupancy_rate:.1f}%',
                    'description': 'Consider reviewing pricing or improving listing quality to attract more bookings.',
                    'priority': 2,
                    'category': 'performance',
                    'metadata': {
                        'metric': 'occupancy',
                        'value': occupancy_rate,
                        'target_range': [60, 70]
                    }
                })
        
        # 2. Incomplete Listings Insight
        incomplete = user_listings.filter(
            Q(description__isnull=True) | Q(description='') |
            Q(property__isnull=True) |
            Q(title__isnull=True) | Q(title='')
        )
        if incomplete.count() > 0:
            insights.append({
                'id': f'incomplete-{timezone.now().strftime("%Y-%m")}',
                'type': 'warning',
                'title': f'{incomplete.count()} listing{"s" if incomplete.count() > 1 else ""} need{"" if incomplete.count() > 1 else "s"} attention',
                'description': 'Complete listings with photos and descriptions get 3x more enquiries on average.',
                'priority': 3,
                'category': 'quality',
                'metadata': {
                    'incomplete_count': incomplete.count(),
                    'incomplete_listings': list(incomplete.values_list('id', flat=True)[:5])
                }
            })
        
        # 3. Views & Engagement Insight
        listing_ids = user_listings.values_list('id', flat=True)
        total_views = ListingEvent.objects.filter(
            listing_id__in=listing_ids,
            event_type='VIEW',
            occurred_at__gte=period_start
        ).count()
        
        if total_views > 100:
            insights.append({
                'id': f'views-high-{timezone.now().strftime("%Y-%m")}',
                'type': 'positive',
                'title': f'{total_views} views in the last {days} days',
                'description': 'Your listings are getting great visibility! Keep your content fresh to maintain momentum.',
                'priority': 4,
                'category': 'engagement',
                'metadata': {
                    'metric': 'views',
                    'value': total_views,
                    'period_days': days
                }
            })
        elif total_views < 20 and user_listings.filter(status='ACTIVE').count() > 0:
            insights.append({
                'id': f'views-low-{timezone.now().strftime("%Y-%m")}',
                'type': 'opportunity',
                'title': 'Low visibility - only {total_views} views',
                'description': 'Consider improving SEO, adding better photos, or promoting your listings.',
                'priority': 2,
                'category': 'engagement',
                'metadata': {
                    'metric': 'views',
                    'value': total_views
                }
            })
        
        # 4. Pricing Opportunity (seasonal)
        current_month = timezone.now().month
        if current_month in [5, 6]:  # May-June (pre-summer)
            insights.append({
                'id': f'seasonal-summer-{timezone.now().year}',
                'type': 'opportunity',
                'title': 'Summer pricing opportunity',
                'description': 'Similar properties increase prices by 15-20% for July-August. Review your pricing strategy.',
                'priority': 5,
                'category': 'pricing',
                'metadata': {
                    'season': 'summer',
                    'suggested_increase_pct': [15, 20],
                    'affected_listings': rental_listings.filter(status='ACTIVE').count()
                }
            })
        
        # Sort by priority and limit to top 5
        insights.sort(key=lambda x: x['priority'])
        
        return Response({
            'insights': insights[:5],
            'generated_at': timezone.now().isoformat(),
            'time_period': time_period
        })


class BulkUpdateView(APIView):
    """
    POST /api/v1/real_estate/portfolio/bulk-update/
    
    Perform bulk operations on multiple listings.
    
    Request Body:
        {
            "listing_ids": [1, 2, 3],
            "action": "update_status" | "adjust_price" | "set_availability",
            "params": {...}
        }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from decimal import Decimal
        
        listing_ids = request.data.get('listing_ids', [])
        action = request.data.get('action')
        params = request.data.get('params', {})
        
        if not listing_ids:
            return Response(
                {'error': 'listing_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not action:
            return Response(
                {'error': 'action is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get listings owned by user
        listings = Listing.objects.filter(
            id__in=listing_ids,
            created_by=request.user
        )
        
        if not listings.exists():
            return Response(
                {'error': 'No listings found or you do not have permission'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        updated = 0
        failed = []
        
        try:
            if action == 'update_status':
                new_status = params.get('status')
                if not new_status:
                    return Response(
                        {'error': 'status parameter is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                updated = listings.update(status=new_status)
                
            elif action == 'adjust_price':
                adjustment_type = params.get('adjustment_type', 'percentage')
                adjustment_value = params.get('adjustment_value')
                
                if adjustment_value is None:
                    return Response(
                        {'error': 'adjustment_value parameter is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                for listing in listings:
                    try:
                        if adjustment_type == 'percentage':
                            # Multiply by percentage (e.g., 1.20 for +20%)
                            listing.base_price = Decimal(str(listing.base_price)) * Decimal(str(adjustment_value))
                        else:
                            # Add fixed amount
                            listing.base_price = Decimal(str(listing.base_price)) + Decimal(str(adjustment_value))
                        listing.save()
                        updated += 1
                    except Exception as e:
                        failed.append({
                            'id': listing.id,
                            'reference': listing.reference_code,
                            'error': str(e)
                        })
                        
            elif action == 'set_availability':
                available_from = params.get('available_from')
                available_to = params.get('available_to')
                
                update_fields = {}
                if available_from:
                    update_fields['available_from'] = available_from
                if available_to:
                    update_fields['available_to'] = available_to
                    
                if update_fields:
                    updated = listings.update(**update_fields)
                else:
                    return Response(
                        {'error': 'available_from or available_to is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {'error': f'Unknown action: {action}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Bulk update failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'success': len(failed) == 0,
            'updated_count': updated,
            'failed_count': len(failed),
            'failed': failed,
            'message': f'Successfully updated {updated} listing{"s" if updated != 1 else ""}'
        })


class PortfolioExportView(APIView):
    """
    POST /api/v1/real_estate/portfolio/export/
    
    Export portfolio data in various formats.
    
    Request Body:
        {
            "format": "csv" | "xlsx",
            "template": "full-report" | "performance-summary" | "financial-data",
            "filters": {...}
        }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        import csv
        from io import StringIO
        from django.http import HttpResponse
        
        format_type = request.data.get('format', 'csv')
        template = request.data.get('template', 'full-report')
        filters = request.data.get('filters', {})
        
        # Get user's listings
        listings = Listing.objects.filter(created_by=request.user).select_related(
            'listing_type',
            'property',
            'property__location'
        )
        
        # Apply filters
        for key, value in filters.items():
            if value and value != 'ALL':
                if key == 'listing_type':
                    listings = listings.filter(listing_type__code=value)
                elif key == 'status':
                    listings = listings.filter(status=value)
                elif key == 'city':
                    listings = listings.filter(property__location__city__iexact=value)
        
        # Define fields based on template
        if template == 'full-report':
            fields = ['reference_code', 'title', 'status', 'listing_type', 'base_price', 
                     'currency', 'city', 'area', 'bedrooms', 'bathrooms']
        elif template == 'performance-summary':
            fields = ['reference_code', 'title', 'status', 'views_30d', 'enquiries_30d', 'bookings_30d']
        elif template == 'financial-data':
            fields = ['reference_code', 'title', 'base_price', 'currency', 'status']
        else:
            fields = ['reference_code', 'title', 'status', 'base_price']
        
        # Generate CSV
        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="portfolio-{timezone.now().strftime("%Y-%m-%d")}.csv"'
            
            writer = csv.writer(response)
            
            # Write header
            header = [field.replace('_', ' ').title() for field in fields]
            writer.writerow(header)
            
            # Write data
            for listing in listings:
                row = []
                for field in fields:
                    if field == 'reference_code':
                        row.append(listing.reference_code)
                    elif field == 'title':
                        row.append(listing.title)
                    elif field == 'status':
                        row.append(listing.status)
                    elif field == 'listing_type':
                        row.append(listing.listing_type.code if listing.listing_type else '')
                    elif field == 'base_price':
                        row.append(str(listing.base_price))
                    elif field == 'currency':
                        row.append(listing.currency)
                    elif field == 'city':
                        row.append(listing.property.location.city if listing.property and listing.property.location else '')
                    elif field == 'area':
                        row.append(listing.property.location.area if listing.property and listing.property.location else '')
                    elif field == 'bedrooms':
                        row.append(listing.property.bedrooms if listing.property else '')
                    elif field == 'bathrooms':
                        row.append(listing.property.bathrooms if listing.property else '')
                    elif field in ['views_30d', 'enquiries_30d', 'bookings_30d']:
                        row.append(0)  # TODO: Calculate from ListingEvent
                    else:
                        row.append('')
                writer.writerow(row)
            
            return response
        else:
            return Response(
                {'error': 'Only CSV format is currently supported'},
                status=status.HTTP_400_BAD_REQUEST
            )


class FilterCountsView(APIView):
    """
    GET /api/v1/real_estate/portfolio/filter-counts/
    
    Get counts for quick filter chips.
    
    Response:
        {
            "all": 42,
            "active": 38,
            "needs_attention": 5,
            "drafts": 4,
            "high_performers": 12
        }
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        listings = Listing.objects.filter(created_by=request.user)
        
        all_count = listings.count()
        active_count = listings.filter(status='ACTIVE').count()
        drafts_count = listings.filter(status='DRAFT').count()
        
        # Needs attention: incomplete or no activity
        needs_attention_count = listings.filter(
            Q(description__isnull=True) | Q(description='') |
            Q(property__isnull=True) |
            Q(status='DRAFT')
        ).count()
        
        # High performers: active with good engagement (simplified)
        high_performers_count = listings.filter(
            status='ACTIVE',
            property__isnull=False
        ).exclude(
            Q(description__isnull=True) | Q(description='')
        ).count()
        
        return Response({
            'all': all_count,
            'active': active_count,
            'needs_attention': needs_attention_count,
            'drafts': drafts_count,
            'high_performers': high_performers_count
        })
