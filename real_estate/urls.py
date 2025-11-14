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
from .api.portfolio_views import PortfolioViewSet, ListingViewSet
from .api.booking_views import AvailabilityCheckView, BookingCreateView

# ViewSet for legacy search
listing_search = ListingSearchViewSet.as_view({"get": "list"})

# Portfolio v1 ViewSets
portfolio_listings = PortfolioViewSet.as_view({"get": "listings"})
portfolio_summary = PortfolioViewSet.as_view({"get": "summary"})
listing_update = ListingViewSet.as_view({"patch": "partial_update", "get": "retrieve"})

urlpatterns = [
    # V1 schema search endpoint (uses vw_listings_search view)
    path('v1/real_estate/listings/search/', ListingSearchView.as_view(), name='real-estate-listing-search'),

    # Legacy search endpoint (keep for backward compatibility)
    path('v1/real_estate/search', listing_search, name='real-estate-search'),

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

    # Booking v1 API endpoints
    path('v1/real_estate/availability/check/', AvailabilityCheckView.as_view(), name='availability-check'),
    path('v1/real_estate/bookings/', BookingCreateView.as_view(), name='booking-create'),
]
