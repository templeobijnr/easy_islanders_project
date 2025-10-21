# assistant/urls.py

from django.urls import path
from . import views  # Corrected from .import
from .views import ListingDetailView, request_listing_photos, twilio_webhook
# Phase 1 imports (auth moved to users app)
from .views_listings import (
    CategoriesListView, SubcategoriesListView,
    ListingCreateView, ListingDetailView as ListingDetailViewNew, MyListingsView, ImageUploadView,
    ListingPublishView, ListingDuplicateView
)

urlpatterns = [
    # ===== PHASE 1: CREATE LISTING (NEW) =====
    # Category management
    path('categories/', CategoriesListView.as_view(), name='categories_list'),
    path('categories/<slug:category_slug>/subcategories/', SubcategoriesListView.as_view(), name='subcategories'),
    
    # Listing CRUD
    path('listings/', ListingCreateView.as_view(), name='listings_create'),
    path('listings/my/', MyListingsView.as_view(), name='my_listings'),
    path('listings/<uuid:listing_id>/', ListingDetailViewNew.as_view(), name='listing_detail_new'),
    path('listings/<uuid:listing_id>/upload-image/', ImageUploadView.as_view(), name='upload_image'),
    path('listings/<uuid:listing_id>/publish/', ListingPublishView.as_view(), name='listing_publish'),
    path('listings/<uuid:listing_id>/duplicate/', ListingDuplicateView.as_view(), name='listing_duplicate'),
    
    # ===== EXISTING ENDPOINTS (PRESERVED FOR COMPATIBILITY) =====
    # Legacy authentication endpoints
    path('auth/register/', views.register_user, name='register-user'),
    path('auth/login-legacy/', views.login_user, name='login-user'),
    path('auth/logout-legacy/', views.logout_user, name='logout-user'),
    path('auth/profile/', views.get_user_profile, name='get-user-profile'),
    path('auth/profile/update/', views.update_user_profile, name='update-user-profile'),
    path('auth/status/', views.check_auth_status, name='check-auth-status'),
    
    # The main AI chat endpoint
    path('chat/', views.chat_with_assistant, name='chat-with-assistant'),
    path('chat/events/', views.handle_chat_event, name='chat-event'),

    # Agent outreach endpoints
    path('listings/outreach/', views.agent_outreach, name='agent-outreach'),
    path('listings/<int:listing_id>/outreach/', views.agent_outreach, name='agent-outreach-by-id'),
    
    # Listing details (legacy)
    path('listings/<int:listing_id>/', views.listing_details, name='listing-details'),
    path('listings/<int:id>/', ListingDetailView.as_view(), name='listing-detail'),
    path('listings/<int:listing_id>/request-photos/', request_listing_photos, name='request-listing-photos'),
    
    # Media serving for listing images
    path('listings/<int:listing_id>/media/<str:filename>', views.serve_listing_media, name='serve-listing-media'),
    
    # Twilio webhook for WhatsApp replies and media
    path('webhooks/twilio/', twilio_webhook, name='twilio-webhook'),
    
    # Notification and image checking endpoints
    path('notifications/', views.get_conversation_notifications, name='get-notifications-by-conversation'),
    path('notifications/clear/', views.clear_notifications, name='clear-notifications'),
    path('listings/<int:listing_id>/images/', views.check_listing_images, name='check-listing-images'),
    path('listings/<int:listing_id>/auto-display/', views.get_auto_display, name='get-auto-display'),
    path('listings/<int:listing_id>/card-display/', views.get_card_display, name='get-card-display'),
    
    # Booking endpoints
    path('bookings/', views.create_booking, name='create-booking'),
    path('bookings/user/', views.get_user_bookings, name='get-user-bookings'),
    path('bookings/<str:booking_id>/status/', views.update_booking_status, name='update-booking-status'),
    
    # Legacy endpoints (keeping for compatibility)
    path('recommendations/', views.get_recommendations, name='get-recommendations'),
    path('knowledge/', views.KnowledgeBaseListView.as_view(), name='knowledge-list'),
    path('webhooks/devi/', views.devi_webhook_receiver, name='devi-webhook-receiver'),
]