# assistant/urls.py

from django.urls import path

# === Core / chat & misc ===
from .views_core import (
    chat_with_assistant,
    handle_chat_event,
    get_recommendations,
    KnowledgeBaseListView,
    devi_webhook_receiver,
    agent_outreach,
    twilio_webhook,        # used in urls
    # twilio_webhook_health  # add if you expose it
    get_current_conversation,
    create_new_conversation,
    migrate_legacy_data,
    listing_details,        # legacy if still present here
    serve_listing_media,    # legacy if still present here
)

# === Listings ===
from .views.listings import (
    CategoriesListView,
    SubcategoriesListView,
    ListingCreateView,
    ListingDetailView as ListingDetailViewNew,
    MyListingsView,
    ImageUploadView,
    ListingPublishView,
    ListingDuplicateView,
    check_listing_images,
    get_auto_display,
    get_card_display,
    # If you implement this per your plan:
    # request_listing_photos,
)

# === Booking ===
from .views.booking import (
    create_booking,
    get_user_bookings,
    update_booking_status,
    cancel_booking,
    get_listing_availability,
)

# === Messages (F.3.1) ===
from .views.messages import (
    get_messages,
    get_unread_count,
    mark_thread_read,
    get_threads,
)

# === Agent ops ===
from .views.agent import (
    agent_search,
    agent_requests,
    seller_inbox,
    agent_create_generic_request,
    # If these truly live here (your audit says they were referenced from agent.py):
    # get_pending_approvals,
    # create_broadcast_approval_gate,
    # approve_broadcast,
    # reject_broadcast,
    # requests_collection,
    # request_detail,
)

from assistant.monitoring.views import prometheus_metrics_view

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
    
    # ===== THREAD STATE MANAGEMENT (F.1) =====
    path('conversations/current/', get_current_conversation, name='get-current-conversation'),
    path('conversations/', create_new_conversation, name='create-new-conversation'),
    path('migrate-legacy-data/', migrate_legacy_data, name='migrate-legacy-data'),

    # ===== HITL APPROVAL GATE (B.3b) =====
    # These functions need to be moved to appropriate view files or imported directly
    # path('broadcasts/pending/', get_pending_approvals, name='get-pending-approvals'),
    # path('broadcasts/approve/', approve_broadcast, name='approve-broadcast'),
    # path('broadcasts/reject/', reject_broadcast, name='reject-broadcast'),
    # path('broadcasts/create-gate/', create_broadcast_approval_gate, name='create-broadcast-gate'),
    
    # ===== EXISTING ENDPOINTS (PRESERVED FOR COMPATIBILITY) =====
    # Legacy authentication endpoints (moved to users app)
    # path('auth/register/', views.register_user, name='register-user'),
    # path('auth/login-legacy/', views.login_user, name='login-user'),
    # path('auth/logout-legacy/', views.logout_user, name='logout-user'),
    # path('auth/profile/', views.get_user_profile, name='get-user-profile'),
    # path('auth/profile/update/', views.update_user_profile, name='update-user-profile'),
    # path('auth/status/', views.check_auth_status, name='check-auth-status'),
    
    # The main AI chat endpoint (only one route to /api/chat/)
    path('chat/', chat_with_assistant, name='chat-with-assistant'),

    # Agent outreach endpoints
    path('listings/outreach/', agent_outreach, name='agent-outreach'),
    path('listings/<int:listing_id>/outreach/', agent_outreach, name='agent-outreach-by-id'),

    # Listing details (legacy)
    path('listings/<int:listing_id>/', listing_details, name='listing-details'),
    path('listings/<int:id>/', ListingDetailViewNew.as_view(), name='listing-detail'),
    # path('listings/<int:listing_id>/request-photos/', request_listing_photos, name='request-listing-photos'),

    # Media serving for listing images
    path('listings/<int:listing_id>/media/<str:filename>', serve_listing_media, name='serve-listing-media'),
    
    # Twilio webhook for WhatsApp replies and media
    path('webhooks/twilio/', twilio_webhook, name='twilio-webhook'),
    
    # Notification and image checking endpoints
    # These need to be imported from views_core or moved to appropriate view files
    # path('notifications/', get_conversation_notifications, name='get-notifications-by-conversation'),
    # path('notifications/clear/', clear_notifications, name='clear-notifications'),
    path('listings/<int:listing_id>/images/', check_listing_images, name='check-listing-images'),
    path('listings/<int:listing_id>/auto-display/', get_auto_display, name='get-auto-display'),
    path('listings/<int:listing_id>/card-display/', get_card_display, name='get-card-display'),
    
    # Booking endpoints
    path('bookings/', create_booking, name='create-booking'),
    path('bookings/user/', get_user_bookings, name='get-user-bookings'),
    path('bookings/<str:booking_id>/', cancel_booking, name='cancel-booking'),
    path('bookings/<str:booking_id>/status/', update_booking_status, name='update-booking-status'),
    path('listings/<uuid:listing_id>/availability/', get_listing_availability, name='listing-availability'),

    # ===== F.3.1 MESSAGES ENDPOINTS (V1 API) =====
    path('v1/messages/', get_messages, name='get-messages'),
    path('v1/messages/unread-count/', get_unread_count, name='unread-count'),
    path('v1/messages/<str:thread_id>/read_status/', mark_thread_read, name='mark-thread-read'),
    path('v1/threads/', get_threads, name='get-threads'),
    # These functions need to be moved to appropriate view files or imported directly
    # path('v1/requests/', requests_collection, name='requests-collection'),
    # path('v1/requests/<uuid:pk>/', request_detail, name='request-detail'),

    # ===== Agent internal endpoints =====
    path('agent/search/', agent_search, name='agent-search'),
    path('agent/requests/', agent_requests, name='agent-requests'),
    path('agent/requests/create/', agent_create_generic_request, name='agent-create-generic-request'),
    path('agent/seller/inbox/', seller_inbox, name='seller-inbox'),
    
    # Legacy endpoints (keeping for compatibility)
    path('recommendations/', get_recommendations, name='get-recommendations'),
    # path('knowledge/', KnowledgeBaseListView.as_view(), name='knowledge-list'),
    path('webhooks/devi/', devi_webhook_receiver, name='devi-webhook-receiver'),
    path('metrics/', prometheus_metrics_view, name='prometheus-metrics'),
]
