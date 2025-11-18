"""
URL routing for Real Estate app.
"""
from django.urls import path

from .views import ListingSearchViewSet
from .api.search_views import ListingSearchView
from .api.dashboard_views import (
    RealEstateOverviewView,
    RealEstatePortfolioView,
    RealEstateLocationView,
    RealEstateOccupancyView,
    RealEstateEarningsView,
    RealEstateSalesPipelineView,
    RealEstateRequestsView,
    RealEstateCalendarView,
    RealEstateMaintenanceView,
    RealEstateOwnersAndTenantsView,
    RealEstatePricingAndPromotionsView,
    RealEstateChannelsAndDistributionView,
    RealEstateProjectsView,
)
from .api.portfolio_views import (
    PortfolioViewSet,
    ListingViewSet,
    PortfolioInsightsView,
    BulkUpdateView,
    PortfolioExportView,
    FilterCountsView,
)
from .api.booking_views import AvailabilityCheckView, BookingCreateView, BlockedDatesView
from .api.property_views import PropertyCreateView
from .api.geo_views import LocationAutocompleteView, ReverseGeocodeView

# ViewSet for legacy search
listing_search = ListingSearchViewSet.as_view({"get": "list"})

# Portfolio v1 ViewSets
portfolio_listings = PortfolioViewSet.as_view({"get": "listings"})
portfolio_summary = PortfolioViewSet.as_view({"get": "summary"})
listing_update = ListingViewSet.as_view({"patch": "partial_update", "get": "retrieve"})
listing_upload_image = ListingViewSet.as_view({"post": "upload_image"})
listing_images = ListingViewSet.as_view({"get": "images"})

urlpatterns = [
    # V1 schema search endpoint (uses vw_listings_search view)
    path('v1/real_estate/listings/search/', ListingSearchView.as_view(), name='real-estate-listing-search'),

    # Legacy search endpoint (keep for backward compatibility)
    path('v1/real_estate/search/', listing_search, name='real-estate-search'),

    # Dashboard API endpoints
    path('dashboard/real-estate/overview', RealEstateOverviewView.as_view(), name='real-estate-dashboard-overview'),
    path('dashboard/real-estate/portfolio', RealEstatePortfolioView.as_view(), name='real-estate-dashboard-portfolio'),
    path('dashboard/real-estate/location', RealEstateLocationView.as_view(), name='real-estate-dashboard-location'),
    path('dashboard/real-estate/occupancy', RealEstateOccupancyView.as_view(), name='real-estate-dashboard-occupancy'),
    path('dashboard/real-estate/earnings', RealEstateEarningsView.as_view(), name='real-estate-dashboard-earnings'),
    path('dashboard/real-estate/sales-pipeline', RealEstateSalesPipelineView.as_view(), name='real-estate-dashboard-sales-pipeline'),
    path('dashboard/real-estate/requests', RealEstateRequestsView.as_view(), name='real-estate-dashboard-requests'),
    path('dashboard/real-estate/calendar', RealEstateCalendarView.as_view(), name='real-estate-dashboard-calendar'),
    path('dashboard/real-estate/maintenance', RealEstateMaintenanceView.as_view(), name='real-estate-dashboard-maintenance'),
    path('dashboard/real-estate/owners-and-tenants', RealEstateOwnersAndTenantsView.as_view(), name='real-estate-dashboard-owners-tenants'),
    path('dashboard/real-estate/pricing-and-promotions', RealEstatePricingAndPromotionsView.as_view(), name='real-estate-dashboard-pricing-promotions'),
    path('dashboard/real-estate/channels-and-distribution', RealEstateChannelsAndDistributionView.as_view(), name='real-estate-dashboard-channels-distribution'),
    path('dashboard/real-estate/projects', RealEstateProjectsView.as_view(), name='real-estate-dashboard-projects'),

    # Portfolio v1 API endpoints
    path('v1/real_estate/portfolio/listings/', portfolio_listings, name='portfolio-listings'),
    path('v1/real_estate/portfolio/summary/', portfolio_summary, name='portfolio-summary'),
    path('v1/real_estate/listings/<int:pk>/', listing_update, name='listing-update'),
    path('v1/real_estate/listings/<int:pk>/upload-image/', listing_upload_image, name='listing-upload-image'),
    path('v1/real_estate/listings/<int:pk>/images/', listing_images, name='listing-images'),

    # Alias endpoint for backward compatibility (maps to generic listings endpoint)
    path('real-estate/listings/<int:pk>/', listing_update, name='legacy-listing-detail'),

    # Booking v1 API endpoints
    path('v1/real_estate/availability/check/', AvailabilityCheckView.as_view(), name='real-estate-availability-check'),
    path('v1/real_estate/bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('v1/real_estate/listings/<int:listing_id>/blocked-dates/', BlockedDatesView.as_view(), name='listing-blocked-dates'),

    # Property v1 API endpoints
    path('v1/real_estate/properties/', PropertyCreateView.as_view(), name='real-estate-property-create'),

    # Geo helper endpoints for seller dashboard (autocomplete + reverse geocode)
    path(
        'v1/real_estate/geo/autocomplete/',
        LocationAutocompleteView.as_view(),
        name='real-estate-geo-autocomplete',
    ),
    path(
        'v1/real_estate/geo/reverse/',
        ReverseGeocodeView.as_view(),
        name='real-estate-geo-reverse',
    ),

    # Portfolio Enhancement APIs (v1)
    path('v1/real_estate/portfolio/insights/', PortfolioInsightsView.as_view(), name='portfolio-insights'),
    path('v1/real_estate/portfolio/bulk-update/', BulkUpdateView.as_view(), name='portfolio-bulk-update'),
    path('v1/real_estate/portfolio/export/', PortfolioExportView.as_view(), name='portfolio-export'),
    path('v1/real_estate/portfolio/filter-counts/', FilterCountsView.as_view(), name='portfolio-filter-counts'),
]
