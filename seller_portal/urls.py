"""
Seller Portal URL Configuration
"""

from django.urls import path
from . import views

app_name = 'seller_portal'

urlpatterns = [
    # Core endpoints
    path('overview/', views.seller_overview, name='seller_overview'),
    path('listings/', views.all_listings, name='all_listings'),
    path('listings/create/', views.create_listing, name='create_listing'),
    path('listings/<str:listing_id>/', views.listing_detail, name='listing_detail'),
    path('listings/<str:listing_id>/update/', views.update_listing, name='update_listing'),
    path('bookings/', views.all_bookings, name='all_bookings'),
    
    # User domains management
    path('domains/', views.user_domains, name='user_domains'),
    path('domains/add/', views.add_domain, name='add_domain'),
    path('domains/<str:domain_id>/', views.remove_domain, name='remove_domain'),
    
    # Analytics endpoints
    path('analytics/revenue/', views.analytics_revenue, name='analytics_revenue'),
    path('analytics/trends/', views.analytics_trends, name='analytics_trends'),
    path('analytics/top-listings/', views.analytics_top_listings, name='analytics_top_listings'),
    path('analytics/conversion/', views.analytics_conversion, name='analytics_conversion'),
    path('analytics/customers/', views.analytics_customers, name='analytics_customers'),
    path('analytics/availability/', views.analytics_availability, name='analytics_availability'),
]
