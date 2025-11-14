from rest_framework import generics, permissions, status, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.db.models import Q
from datetime import datetime
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing, SellerProfile, Category, SubCategory, ListingImage
from bookings.models import Booking
from .serializers import (
    BookingSerializer,
    ListingSerializer,
    ListingDetailSerializer,
    SellerProfileSerializer,
    SellerProfileCreateSerializer,
    SellerAnalyticsSerializer,
    CategorySerializer,
    SubCategorySerializer,
    DomainSerializer,
    REDashboardOverviewSerializer,
    REPortfolioSerializer,
    RERequestsSerializer,
    RECalendarSerializer,
)
from .analytics import compute_dashboard_summary
from django.utils import timezone

try:
    from real_estate.models import Listing as REListing, ShortTermBlock as REBlock
except Exception:  # pragma: no cover
    REListing = None
    REBlock = None


class ShortTermBookingView(generics.CreateAPIView):
    """
    Create a short-term booking for a listing.

    POST /api/shortterm/bookings/
    Body: {
        "listing_id": "uuid",
        "check_in": "2025-12-01",
        "check_out": "2025-12-10"
    }
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        listing_id = request.data.get('listing_id')
        check_in_str = request.data.get('check_in')
        check_out_str = request.data.get('check_out')

        if not listing_id or not check_in_str or not check_out_str:
            return Response(
                {"error": "Missing required fields: listing_id, check_in, check_out"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if listing exists
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            return Response(
                {"error": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Parse dates
        try:
            check_in = datetime.strptime(check_in_str, '%Y-%m-%d').date()
            check_out = datetime.strptime(check_out_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for overlapping bookings
        overlaps = Booking.objects.filter(
            listing=listing,
            booking_type='short_term',
            status__in=['pending', 'confirmed'],
            check_in__lt=check_out,
            check_out__gt=check_in,
        ).exists()

        if overlaps:
            return Response(
                {"error": "Selected dates are not available for this listing."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create booking
        serializer = self.get_serializer(data={
            'listing': listing.id,
            'check_in': check_in,
            'check_out': check_out,
            'booking_type': 'short_term',
        })
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, listing=listing, status='pending')

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LongTermBookingView(generics.CreateAPIView):
    """
    Create a long-term booking/reservation for a listing.

    POST /api/longterm/bookings/
    Body: {
        "listing_id": "uuid",
        "notes": "Optional notes"
    }
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        listing_id = request.data.get('listing_id')
        notes = request.data.get('notes', '')

        if not listing_id:
            return Response(
                {"error": "Missing required field: listing_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if listing exists
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            return Response(
                {"error": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create long-term booking
        serializer = self.get_serializer(data={
            'listing': listing.id,
            'booking_type': 'long_term',
            'notes': notes,
        })
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, listing=listing, status='pending')

        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def check_availability(request):
    """
    Check if a listing is available for given dates.

    POST /api/shortterm/check-availability/
    Body: {
        "listing_id": "uuid",
        "check_in": "2025-12-01",
        "check_out": "2025-12-10"
    }

    Returns: { "available": true/false, "conflicts": [] }
    """
    listing_id = request.data.get('listing_id')
    check_in_str = request.data.get('check_in')
    check_out_str = request.data.get('check_out')

    if not listing_id or not check_in_str or not check_out_str:
        return Response(
            {"error": "Missing parameters: listing_id, check_in, check_out"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Parse dates
    try:
        check_in = datetime.strptime(check_in_str, '%Y-%m-%d').date()
        check_out = datetime.strptime(check_out_str, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {"error": "Invalid date format. Use YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check for overlapping bookings
    overlapping_bookings = Booking.objects.filter(
        listing_id=listing_id,
        booking_type='short_term',
        status__in=['confirmed', 'pending'],
        check_in__lt=check_out,
        check_out__gt=check_in,
    )

    conflicts = [{
        'id': str(booking.id),
        'check_in': booking.check_in.strftime('%Y-%m-%d'),
        'check_out': booking.check_out.strftime('%Y-%m-%d'),
        'status': booking.status
    } for booking in overlapping_bookings]

    return Response({
        "available": not overlapping_bookings.exists(),
        "conflicts": conflicts
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def booking_status_webhook(request):
    """
    Webhook for external systems (Twilio/payment) to update booking status.

    POST /api/bookings/status-webhook/
    Body: {
        "booking_id": "uuid",
        "status": "confirmed" | "cancelled" | "completed"
    }
    """
    booking_id = request.data.get('booking_id')
    new_status = request.data.get('status')

    if not booking_id or not new_status:
        return Response(
            {"error": "Missing parameters: booking_id, status"},
            status=status.HTTP_400_BAD_REQUEST
        )

    valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
    if new_status not in valid_statuses:
        return Response(
            {"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        booking = Booking.objects.get(id=booking_id)
        booking.status = new_status
        booking.save()

        return Response({
            "message": f"Booking {booking_id} updated to {new_status}",
            "booking": BookingSerializer(booking).data
        })
    except Booking.DoesNotExist:
        return Response(
            {"error": "Booking not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_bookings(request):
    """
    Get all bookings for the authenticated user.

    GET /api/bookings/my-bookings/
    Query params: ?booking_type=short_term|long_term&status=pending|confirmed|cancelled
    """
    bookings = Booking.objects.filter(user=request.user)

    # Filter by booking type
    booking_type = request.query_params.get('booking_type')
    if booking_type:
        bookings = bookings.filter(booking_type=booking_type)

    # Filter by status
    status_filter = request.query_params.get('status')
    if status_filter:
        bookings = bookings.filter(status=status_filter)

    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_booking(request, booking_id):
    """
    Update a booking (e.g., cancel it).
    
    PATCH /api/bookings/{booking_id}/
    Body: {"status": "cancelled"}
    """
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Booking not found or you do not have permission to modify it'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Only allow updating status
    new_status = request.data.get('status')
    if new_status:
        # Validate status
        valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Don't allow re-opening cancelled bookings
        if booking.status == 'cancelled' and new_status != 'cancelled':
            return Response(
                {'error': 'Cannot change status of a cancelled booking'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = new_status
        booking.save()
        
        serializer = BookingSerializer(booking)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(
        {'error': 'No valid fields to update'},
        status=status.HTTP_400_BAD_REQUEST
    )


class SellerProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for seller profiles.

    Endpoints:
    - GET /api/sellers/ - List all sellers
    - POST /api/sellers/ - Create seller profile
    - GET /api/sellers/{id}/ - Get seller details
    - PATCH /api/sellers/{id}/ - Update seller profile
    - DELETE /api/sellers/{id}/ - Delete seller profile
    - GET /api/sellers/me/ - Get current user's seller profile
    """

    queryset = SellerProfile.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['business_name', 'description']
    ordering_fields = ['rating', 'created_at', 'total_listings']
    filterset_fields = ['verified']

    def get_serializer_class(self):
        if self.action == 'create':
            return SellerProfileCreateSerializer
        return SellerProfileSerializer

    def get_queryset(self):
        """Filter queryset based on permissions"""
        queryset = super().get_queryset()

        # Regular users can only see verified sellers
        if not self.request.user.is_staff:
            queryset = queryset.filter(verified=True)

        return queryset

    def perform_create(self, serializer):
        """Create seller profile for current user"""
        # Check if user already has a seller profile
        if SellerProfile.objects.filter(user=self.request.user).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("User already has a seller profile")

        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Only allow users to update their own profile"""
        if serializer.instance.user != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update your own seller profile")
        serializer.save()

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's seller profile"""
        try:
            seller = SellerProfile.objects.get(user=request.user)
            serializer = self.get_serializer(seller)
            return Response(serializer.data)
        except SellerProfile.DoesNotExist:
            return Response(
                {"detail": "You do not have a seller profile"},
                status=status.HTTP_404_NOT_FOUND
            )




@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_analytics(request):
    """
    Get comprehensive analytics for the current seller's dashboard.

    GET /api/sellers/analytics/

    Returns:
    {
        "stats": {
            "total_views": 1234,
            "total_listings": 15,
            "active_listings": 12,
            "pending_requests": 8,
            "conversion_rate": 45.5,
            "avg_rating": 4.5,
            ...
        },
        "category_breakdown": {
            "Real Estate": 8,
            "Services": 5,
            ...
        },
        "trends": {
            "period_days": 30,
            "new_listings": 3,
            ...
        },
        "insights": [
            "💡 Tip: Adding more listings increases visibility...",
            ...
        ]
    }
    """
    try:
        seller = SellerProfile.objects.get(user=request.user)
        dashboard_data = compute_dashboard_summary(seller)
        serializer = SellerAnalyticsSerializer(dashboard_data)
        return Response(serializer.data)
    except SellerProfile.DoesNotExist:
        return Response(
            {"detail": "You do not have a seller profile"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_listings(request):
    """
    Get all listings for the authenticated user's seller profile.

    GET /api/listings/my/
    Query params: ?status=active|inactive|pending_verification&category=slug

    Returns: List of listings owned by the current seller
    """
    # Get all listings for this user (owner)
    listings = Listing.objects.filter(owner=request.user).select_related('category', 'subcategory').prefetch_related('images')

    # Filter by status
    status_filter = request.query_params.get('status')
    if status_filter:
        listings = listings.filter(status=status_filter)

    # Filter by category
    category_filter = request.query_params.get('category')
    if category_filter:
        listings = listings.filter(category__slug=category_filter)

    # Order by most recent first
    listings = listings.order_by('-created_at')

    # Serialize
    serializer = ListingSerializer(listings, many=True)

    return Response({
        "listings": serializer.data,
        "count": listings.count()
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def categories_list(request):
    """
    Get all available categories.

    GET /api/categories/

    Returns: List of all categories with their subcategories
    """
    from .models import Category
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"Categories API called - Database: {Category.objects.db}")
    
    categories = Category.objects.all().prefetch_related('subcategories')
    logger.info(f"Found {categories.count()} categories in database")

    # Build response
    categories_data = []
    for category in categories:
        subcategories_data = [
            {
                'id': sub.id,
                'slug': sub.slug,
                'name': sub.name,
                'display_order': sub.display_order,
            }
            for sub in category.subcategories.all()
        ]

        categories_data.append({
            'id': str(category.id),
            'slug': category.slug,
            'name': category.name,
            'description': category.description,
            'schema': category.schema,
            'is_bookable': category.is_bookable,
            'is_active': category.is_active,
            'icon': category.icon,
            'color': category.color,
            'subcategories': subcategories_data,
        })

    logger.info(f"Returning {len(categories_data)} categories")
    return Response({
        "categories": categories_data,
        "count": len(categories_data)
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def subcategories_list(request, category_slug):
    """
    Get all subcategories for a specific category.

    GET /api/categories/{slug}/subcategories/

    Returns: List of subcategories for the specified category
    """
    from .models import Category, Subcategory

    try:
        category = Category.objects.get(slug=category_slug)
    except Category.DoesNotExist:
        return Response(
            {"error": "Category not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    subcategories = Subcategory.objects.filter(category=category)

    subcategories_data = [
        {
            'id': sub.id,
            'slug': sub.slug,
            'name': sub.name,
            'display_order': sub.display_order,
            'category': {
                'id': category.id,
                'slug': category.slug,
                'name': category.name,
            }
        }
        for sub in subcategories
    ]

    return Response({
        "subcategories": subcategories_data,
        "category": {
            'id': category.id,
            'slug': category.slug,
            'name': category.name,
        },
        "count": len(subcategories_data)
    })


# ============================================================================
# VIEWSETS FOR MODERN REST API
# ============================================================================


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for browsing categories.
    
    GET /api/categories/              - List all active categories
    GET /api/categories/{id}/         - Get category details
    GET /api/categories/{id}/subcategories/  - Get subcategories for category
    """
    queryset = Category.objects.filter(is_active=True).prefetch_related('subcategories')
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    pagination_class = None  # Disable pagination
    
    def list(self, request, *args, **kwargs):
        """Override list to return custom format expected by frontend"""
        import logging
        logger = logging.getLogger(__name__)
        logger.error("CategoryViewSet.list called")
        
        queryset = self.filter_queryset(self.get_queryset())
        logger.error(f"Queryset count: {queryset.count()}")
        
        serializer = self.get_serializer(queryset, many=True)
        logger.error(f"Serialized data length: {len(serializer.data)}")
        
        return Response({
            "categories": serializer.data,
            "count": len(serializer.data)
        })
    
    @action(detail=True, methods=['get'])
    def subcategories(self, request, slug=None):
        """Get all subcategories for a specific category"""
        category = self.get_object()
        subcats = category.subcategories.all()
        serializer = SubCategorySerializer(subcats, many=True)
        return Response(serializer.data)


class ListingViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing listings.
    
    GET    /api/listings/                    - List listings with filters
    POST   /api/listings/                    - Create a new listing
    GET    /api/listings/{id}/               - Get listing details
    PUT    /api/listings/{id}/               - Update listing
    DELETE /api/listings/{id}/               - Delete listing
    
    Filters:
    - category={slug}        - Filter by category slug
    - subcategory={slug}     - Filter by subcategory slug
    - status={status}        - Filter by status (active, draft, sold, paused)
    - search={query}         - Full-text search in title and description
    - ordering={field}       - Sort by field (created_at, price, views, -created_at)
    
    Example:
    GET /api/listings/?category=real-estate&status=active&search=apartment
    """
    queryset = Listing.objects.select_related('category', 'subcategory', 'owner').prefetch_related('images')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'description']
    filterset_fields = ['category__slug', 'subcategory__slug', 'status', 'is_featured']
    ordering_fields = ['created_at', 'price', 'views', '-created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail views"""
        if self.action == 'retrieve':
            return ListingDetailSerializer
        return ListingSerializer
    
    def get_queryset(self):
        """Filter queryset by owner if requested and support 'domain' alias."""
        queryset = super().get_queryset()
        params = self.request.query_params

        # Allow viewing own listings even if not active
        if self.request.user.is_authenticated and params.get('my_listings'):
            queryset = queryset.filter(owner=self.request.user)
        else:
            # Non-owners can only see active listings
            queryset = queryset.filter(status='active')

        # Optional domain alias (maps to category slug)
        domain_slug = params.get('domain')
        if domain_slug:
            queryset = queryset.filter(category__slug=domain_slug)

        # Public owner filters for storefronts
        owner_id = params.get('owner') or params.get('owner_id')
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)
        seller_slug = params.get('seller') or params.get('seller_slug')
        if seller_slug:
            queryset = queryset.filter(owner__seller_profile__slug=seller_slug)

        return queryset
    
    def perform_create(self, serializer):
        """Set owner and bridge domain-specific records when necessary."""
        listing = serializer.save(owner=self.request.user)
        try:
            self._maybe_bridge_real_estate(listing)
        except Exception:
            # Non-fatal: log and continue without breaking listing creation
            import logging
            logging.getLogger(__name__).exception("Failed to bridge real_estate record for listing %s", listing.id)
    
    def perform_update(self, serializer):
        """Ensure user can only update their own listings"""
        if serializer.instance.owner != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update your own listings")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Ensure user can only delete their own listings"""
        if instance.owner != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own listings")
        instance.delete()
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_listings(self, request):
        """Get all listings for the authenticated user"""
        queryset = Listing.objects.filter(owner=request.user).select_related('category', 'subcategory').prefetch_related('images')
        
        # Apply filters
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='upload-image', permission_classes=[permissions.IsAuthenticated])
    def upload_image(self, request, pk=None):
        """Upload a single image for a listing.

        Expects multipart with key 'image'. Returns the created image record.
        """
        listing = self.get_object()
        if listing.owner != request.user and not request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only upload images for your own listings")

        image_file = request.FILES.get('image')
        if not image_file:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        img = ListingImage.objects.create(listing=listing, image=image_file)
        from .serializers import ListingImageSerializer
        return Response(ListingImageSerializer(img).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='duplicate', permission_classes=[permissions.IsAuthenticated])
    def duplicate(self, request, pk=None):
        """Create a draft copy of the listing for quick duplication."""
        src = self.get_object()
        if src.owner != request.user and not request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only duplicate your own listings")

        dup = Listing.objects.create(
            owner=request.user,
            category=src.category,
            subcategory=src.subcategory,
            domain=src.domain,
            title=f"Copy of {src.title}",
            description=src.description,
            price=src.price,
            currency=src.currency,
            location=src.location,
            latitude=src.latitude,
            longitude=src.longitude,
            dynamic_fields=src.dynamic_fields,
            listing_kind=src.listing_kind,
            transaction_type=src.transaction_type,
            status='draft',
            is_featured=False,
        )

        # Optionally bridge for domain models as needed
        try:
            self._maybe_bridge_real_estate(dup)
        except Exception:
            import logging
            logging.getLogger(__name__).exception("Failed to bridge duplicated real_estate record for listing %s", dup.id)

        serializer = self.get_serializer(dup)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # --- Helpers ---
    def _maybe_bridge_real_estate(self, listing: Listing) -> None:
        """If listing belongs to real_estate category, ensure a corresponding
        real_estate.Listing exists and is linked for dashboard views.
        """
        if not listing.category or listing.category.slug not in {'real_estate', 'real-estate', 'accommodation'}:
            return
        # real_estate app may be optional; guard imports
        if REListing is None:
            return
        # If already bridged, nothing to do
        if REListing.objects.filter(listing=listing).exists():
            return

        # Map fields
        dyn = listing.dynamic_fields or {}
        rent_type = dyn.get('rental_term')
        if rent_type not in ('short_term', 'long_term', 'both'):
            # Derive from transaction_type when possible
            rent_type = 'short_term' if listing.transaction_type == 'rent_short' else (
                'long_term' if listing.transaction_type in ('rent_long', 'sale', 'project') else 'both'
            )
        property_type = (getattr(listing.subcategory, 'slug', None) or 'apartment')
        bedrooms = int(dyn.get('bedrooms') or 0)
        try:
            from decimal import Decimal
            bathrooms_val = dyn.get('bathrooms')
            bathrooms = Decimal(str(bathrooms_val)) if bathrooms_val is not None else Decimal('1.0')
        except Exception:
            from decimal import Decimal
            bathrooms = Decimal('1.0')

        # Create RE property and link to generic listing
        prop = REListing(
            owner=listing.owner,
            title=listing.title,
            description=listing.description or '',
            city=listing.location or '',
            district='',
            lat=listing.latitude,
            lng=listing.longitude,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            property_type=property_type,
            rent_type=rent_type,
            currency=(listing.currency or 'EUR')[:3],
            monthly_price=int(listing.price or 0) if rent_type in ('long_term', 'both') else None,
            nightly_price=int(listing.price or 0) if rent_type == 'short_term' else None,
            listing=listing,
        )
        # Optional extended fields from dynamic_fields
        try:
            from datetime import date as _date
            af = dyn.get('available_from')
            if isinstance(af, str) and len(af) >= 10:
                prop.available_from = _date.fromisoformat(af[:10])
        except Exception:
            pass
        try:
            mt = dyn.get('min_term_months')
            if mt is not None:
                prop.min_term_months = int(mt)
        except Exception:
            pass
        try:
            dep = dyn.get('deposit')
            if dep is not None:
                prop.deposit = int(dep)
        except Exception:
            pass
        try:
            mn = dyn.get('min_nights')
            if mn is not None:
                prop.min_nights = int(mn)
        except Exception:
            pass
        prop.save()


class DomainViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for marketplace domains.

    Domains map 1:1 to top-level Category records to preserve current schema.

    - GET /api/domains/                      List active domains
    - GET /api/domains/{slug}/               Domain detail
    - GET /api/domains/{slug}/categories/    Categories (SubCategories) for domain
    """

    lookup_field = 'slug'
    serializer_class = DomainSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Category.objects.filter(is_active=True).order_by('display_order', 'name')

    @action(detail=True, methods=['get'])
    def categories(self, request, slug=None):
        domain = self.get_object()
        subcats = domain.subcategories.all().order_by('display_order', 'name')
        return Response(SubCategorySerializer(subcats, many=True).data)


class RealEstateDashboardViewSet(viewsets.ViewSet):
    """
    Seller Real Estate dashboard endpoints.

    Base path: /api/dashboard/real-estate/
    All endpoints require authentication and operate on properties
    linked to the current user's aggregate listings (real_estate.Listing.listing.owner = user).
    """

    permission_classes = [permissions.IsAuthenticated]

    def _get_user_properties(self, request):
        if REListing is None:
            return REListing.objects.none()  # type: ignore
        return REListing.objects.select_related('listing').filter(listing__owner=request.user)

    def _get_user_bookings(self, request, props_qs):
        listing_ids = list(props_qs.exclude(listing__isnull=True).values_list('listing_id', flat=True))
        return Booking.objects.filter(listing_id__in=listing_ids)

    @action(detail=False, methods=['get'])
    def overview(self, request):
        now = timezone.now()
        start_range = now - timezone.timedelta(days=30)
        props = self._get_user_properties(request)
        total_units = props.count()

        # Occupancy over last 30 days
        bookings = self._get_user_bookings(request, props).filter(
            status__in=['confirmed', 'in_progress'],
            start_date__lt=now,
            end_date__gt=start_range,
        )

        total_nights = max(total_units * 30, 1)
        occupied_nights = 0
        for b in bookings:
            s = max(b.start_date, start_range)
            e = min(b.end_date or now, now)
            delta = (e - s).days
            if delta > 0:
                occupied_nights += delta

        occupancy_rate = round((occupied_nights / total_nights) * 100.0, 2) if total_nights else 0.0
        units_occupied = min(total_units, bookings.values('listing_id').distinct().count())

        # Monthly revenue (current month)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_bookings = self._get_user_bookings(request, props).filter(
            status__in=['confirmed', 'completed'],
            start_date__gte=month_start,
        )
        from decimal import Decimal
        monthly_revenue = sum((b.total_price or Decimal('0.00')) for b in month_bookings)
        currency = 'EUR'

        data = {
            'occupancy_rate': occupancy_rate,
            'units_occupied': units_occupied,
            'total_units': total_units,
            'monthly_revenue': monthly_revenue,
            'revenue_currency': currency,
            'summary_period_days': 30,
        }
        return Response(REDashboardOverviewSerializer(data).data)

    @action(detail=False, methods=['get'])
    def portfolio(self, request):
        now = timezone.now()
        start_range = now - timezone.timedelta(days=30)
        props = self._get_user_properties(request)

        # Mix by property_type
        from collections import Counter
        mix_counter = Counter(list(props.values_list('property_type', flat=True)))
        mix = [{'label': k or 'unknown', 'count': v} for k, v in mix_counter.items()]

        # Helper: occupancy last 30d per property
        listing_map = {p.id: p for p in props}
        occupied_nights_map = {p.id: 0 for p in props}

        bookings = self._get_user_bookings(request, props).filter(
            status__in=['confirmed', 'in_progress'],
            start_date__lt=now,
            end_date__gt=start_range,
        )
        for b in bookings:
            s = max(b.start_date, start_range)
            e = min(b.end_date or now, now)
            delta = (e - s).days
            if delta > 0 and b.listing_id:
                # find real_estate property by reverse OneToOne
                prop = props.filter(listing_id=b.listing_id).first()
                if prop:
                    occupied_nights_map[prop.id] += delta

        def prop_status(prop):
            # Simple status: occupied if any overlapping booking today; else vacant
            active = self._get_user_bookings(request, props).filter(
                listing=prop.listing,
                status__in=['confirmed', 'in_progress'],
                start_date__lte=now,
                end_date__gte=now,
            ).exists()
            if active:
                return 'occupied'
            # Maintenance check using REBlock
            if REBlock and REBlock.objects.filter(listing=prop, start_date__lte=now.date(), end_date__gte=now.date()).exists():
                return 'maintenance'
            return 'vacant'

        items = []
        for p in props:
            occ = round((occupied_nights_map.get(p.id, 0) / 30) * 100.0, 1)
            items.append({
                'id': p.id,
                # Expose generic listing UUID for client-side actions (edit/delete)
                'listing_id': getattr(p, 'listing_id', None),
                'title': p.title,
                'property_type': p.property_type,
                'city': p.city,
                'status': prop_status(p),
                'purpose': 'rent' if p.rent_type in ('short_term', 'long_term', 'both') else 'sale',
                'nightly_price': p.nightly_price,
                'monthly_price': p.monthly_price,
                'occupancy_last_30d': occ,
            })

        # Underperforming: occupancy < 40%
        underperforming = [it for it in items if it['occupancy_last_30d'] < 40.0]

        summary = {
            'total_units': props.count(),
            'short_term': props.filter(rent_type='short_term').count(),
            'long_term': props.filter(rent_type='long_term').count(),
            'both': props.filter(rent_type='both').count(),
        }

        return Response(REPortfolioSerializer({
            'summary': summary,
            'mix': mix,
            'items': items,
            'underperforming': underperforming,
        }).data)

    @action(detail=False, methods=['get'])
    def requests(self, request):
        props = self._get_user_properties(request)
        bookings = self._get_user_bookings(request, props).filter(status='pending').order_by('-created_at')[:100]
        items = []
        for b in bookings:
            items.append({
                'id': b.id,
                'created_at': b.created_at,
                'status': b.status,
                'customer_name': getattr(b.user, 'username', ''),
                'start_date': b.start_date,
                'end_date': b.end_date,
                'listing_id': b.listing_id,
                'listing_title': b.listing.title if b.listing_id else '',
                'requested_type': getattr(getattr(b, 'booking_type', None), 'slug', ''),
            })
        return Response(RERequestsSerializer({'total': len(items), 'items': items}).data)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        # Accept range via query (start, end); default next 30 days
        try:
            start_param = request.query_params.get('start')
            end_param = request.query_params.get('end')
            now = timezone.now()
            start_dt = datetime.fromisoformat(start_param) if start_param else now
            end_dt = datetime.fromisoformat(end_param) if end_param else (now + timezone.timedelta(days=30))
        except Exception:
            return Response({'error': 'Invalid date format. Use ISO 8601.'}, status=400)

        props = self._get_user_properties(request)
        bookings = self._get_user_bookings(request, props).filter(
            start_date__lt=end_dt,
            end_date__gt=start_dt,
            status__in=['confirmed', 'in_progress', 'pending']
        )
        events = []
        for b in bookings:
            events.append({
                'id': f'booking:{b.id}',
                'kind': 'booking',
                'title': b.listing.title if b.listing_id else 'Booking',
                'start': b.start_date,
                'end': b.end_date or b.start_date,
                'listing_id': b.listing_id,
                'listing_title': b.listing.title if b.listing_id else '',
            })

        if REBlock is not None:
            blocks = REBlock.objects.filter(
                listing__in=props,
                start_date__lte=end_dt.date(),
                end_date__gte=start_dt.date(),
            )
            for blk in blocks:
                events.append({
                    'id': f'block:{blk.id}',
                    'kind': 'block',
                    'title': f'Blocked: {blk.start_date}–{blk.end_date}',
                    'start': datetime.combine(blk.start_date, datetime.min.time(), tzinfo=timezone.get_current_timezone()),
                    'end': datetime.combine(blk.end_date, datetime.max.time(), tzinfo=timezone.get_current_timezone()),
                    'listing_id': getattr(blk.listing, 'listing_id', None),
                    'listing_title': blk.listing.title,
                })

        return Response(RECalendarSerializer({
            'range_start': start_dt,
            'range_end': end_dt,
            'events': events,
        }).data)

    # Stubs for later deep-dive sections (return empty shapes to avoid 404s)
    @action(detail=False, methods=['get'])
    def occupancy(self, request):
        now = timezone.now()
        props = self._get_user_properties(request)
        # Build last 6 months occupancy timeline
        timeline = []
        for i in range(5, -1, -1):
            month = (now - timezone.timedelta(days=30 * i))
            month_start = month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            # crude month end
            next_month = (month_start + timezone.timedelta(days=32)).replace(day=1)
            month_end = next_month
            days = (month_end - month_start).days or 30
            total_nights = max(props.count() * days, 1)
            occupied_nights = 0
            qs = self._get_user_bookings(request, props).filter(
                status__in=['confirmed', 'in_progress'],
                start_date__lt=month_end,
                end_date__gt=month_start,
            )
            for b in qs:
                s = max(b.start_date, month_start)
                e = min(b.end_date or month_end, month_end)
                delta = (e - s).days
                if delta > 0:
                    occupied_nights += delta
            rate = round((occupied_nights / total_nights) * 100.0, 2) if total_nights else 0.0
            timeline.append({
                'label': month_start.strftime('%Y-%m'),
                'occupancy_rate': rate,
                'occupied_nights': occupied_nights,
                'total_nights': total_nights,
            })

        vacancy = [{
            'status': 'vacant',
            'count': props.count() - self._get_user_bookings(request, props).filter(
                status__in=['confirmed', 'in_progress'],
                start_date__lte=now,
                end_date__gte=now,
            ).values('listing_id').distinct().count()
        }]

        return Response({'timeline': timeline, 'vacancy': vacancy, 'seasonality': [], 'forecast': {}})

    @action(detail=False, methods=['get'])
    def earnings(self, request):
        now = timezone.now()
        props = self._get_user_properties(request)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        ytd_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        from decimal import Decimal

        month_bookings = self._get_user_bookings(request, props).filter(
            status__in=['confirmed', 'completed'],
            start_date__gte=month_start,
        )
        ytd_bookings = self._get_user_bookings(request, props).filter(
            status__in=['confirmed', 'completed'],
            start_date__gte=ytd_start,
        )

        total_month = sum((b.total_price or Decimal('0.00')) for b in month_bookings)
        total_ytd = sum((b.total_price or Decimal('0.00')) for b in ytd_bookings)

        # By property breakdown (month)
        by_property_map = {}
        for p in props:
            by_property_map[p.id] = {
                'id': p.id,
                'title': p.title,
                'monthly_revenue': Decimal('0.00'),
                'ytd_revenue': Decimal('0.00'),
            }
        for b in month_bookings:
            prop = props.filter(listing_id=b.listing_id).first()
            if prop:
                by_property_map[prop.id]['monthly_revenue'] += (b.total_price or Decimal('0.00'))
        for b in ytd_bookings:
            prop = props.filter(listing_id=b.listing_id).first()
            if prop:
                by_property_map[prop.id]['ytd_revenue'] += (b.total_price or Decimal('0.00'))

        by_property = list(by_property_map.values())
        top_performers = sorted(by_property, key=lambda x: x['monthly_revenue'], reverse=True)[:5]

        summary = {
            'month_total': total_month,
            'ytd_total': total_ytd,
            'currency': 'EUR',
        }

        return Response({'summary': summary, 'by_property': by_property, 'payouts': [], 'top_performers': top_performers})

    @action(detail=False, methods=['get'], url_path='sales-pipeline')
    def sales_pipeline(self, request):
        return Response({'funnel': [], 'stages': {}, 'agent_performance': [], 'stalled': []})

    @action(detail=False, methods=['get'])
    def location(self, request):
        now = timezone.now()
        start_range = now - timezone.timedelta(days=30)
        props = self._get_user_properties(request)
        areas = []
        # Group by city
        cities = props.values_list('city', flat=True).distinct()
        for city in cities:
            city_props = props.filter(city=city)
            total_units = city_props.count()
            total_nights = max(total_units * 30, 1)
            # occupancy
            bookings = self._get_user_bookings(request, city_props).filter(
                status__in=['confirmed', 'in_progress'],
                start_date__lt=now,
                end_date__gt=start_range,
            )
            occupied_nights = 0
            from decimal import Decimal
            revenue = Decimal('0.00')
            for b in bookings:
                s = max(b.start_date, start_range)
                e = min(b.end_date or now, now)
                delta = (e - s).days
                if delta > 0:
                    occupied_nights += delta
                revenue += (b.total_price or Decimal('0.00'))
            occ_rate = round((occupied_nights / total_nights) * 100.0, 2) if total_nights else 0.0
            areas.append({
                'city': city or 'Unknown',
                'units': total_units,
                'occupancy_rate': occ_rate,
                'monthly_revenue': revenue,
            })

        insights = []
        if areas:
            best = max(areas, key=lambda a: a['occupancy_rate'])
            insights.append({'type': 'info', 'text': f"Highest occupancy in {best['city']} ({best['occupancy_rate']}%)"})

        return Response({'areas': areas, 'insights': insights, 'opportunities': []})

    @action(detail=False, methods=['get'])
    def maintenance(self, request):
        return Response({'tickets': [], 'stats': {}, 'inspections': []})

    @action(detail=False, methods=['get'], url_path='owners-tenants')
    def owners_tenants(self, request):
        return Response({'owners': [], 'tenants': [], 'lease_expiries': []})

    @action(detail=False, methods=['get'], url_path='pricing-promotions')
    def pricing_promotions(self, request):
        return Response({'suggestions': [], 'campaigns': [], 'competitive_set': []})

    @action(detail=False, methods=['get'], url_path='channels')
    def channels(self, request):
        return Response({'performance': [], 'mix': [], 'settings': {}})

    @action(detail=False, methods=['get'])
    def projects(self, request):
        return Response({'projects': [], 'funnel': [], 'timeline': []})


class StorefrontViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public storefronts per seller.

    - GET /api/storefronts/{slug}/                 → Seller profile + summary
    - GET /api/storefronts/{slug}/domains/         → Domains (category slugs) with counts
    - GET /api/storefronts/{slug}/listings/?domain=... → Active listings for seller, optionally by domain
    """

    queryset = SellerProfile.objects.filter(verified=True, storefront_published=True).select_related('user')
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    @action(detail=True, methods=['get'])
    def domains(self, request, slug=None):
        seller = self.get_object()
        qs = Listing.objects.filter(owner=seller.user, status='active').select_related('category')
        counts = {}
        for l in qs:
            if l.category:
                key = l.category.slug
                counts[key] = counts.get(key, 0) + 1
        data = [
            {"slug": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: x[0])
        ]
        return Response({"domains": data, "total": qs.count()})

    @action(detail=True, methods=['get'])
    def listings(self, request, slug=None):
        seller = self.get_object()
        domain = request.query_params.get('domain')
        qs = Listing.objects.filter(owner=seller.user, status='active').select_related('category', 'subcategory', 'owner').prefetch_related('images')
        if domain:
            qs = qs.filter(category__slug=domain)
        page = self.paginate_queryset(qs)
        ser = ListingSerializer(page or qs, many=True, context={'request': request})
        if page is not None:
            return self.get_paginated_response(ser.data)
        return Response(ser.data)
