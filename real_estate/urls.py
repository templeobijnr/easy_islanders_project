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

# ViewSet for legacy search
listing_search = ListingSearchViewSet.as_view({"get": "list"})

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
]
