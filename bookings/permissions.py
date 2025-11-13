"""
Easy Islanders Booking System - Custom Permissions

Permission classes for booking API endpoints.
"""
from rest_framework import permissions


class IsBookingOwner(permissions.BasePermission):
    """
    Permission: Only booking owner can view/modify their bookings.
    """
    def has_object_permission(self, request, view, obj):
        # Booking owner can always access
        return obj.user == request.user


class IsSellerOrOwner(permissions.BasePermission):
    """
    Permission: Seller of listing or booking owner can access.
    """
    def has_object_permission(self, request, view, obj):
        # Booking owner can access
        if obj.user == request.user:
            return True

        # Seller of listing can access
        if obj.listing and hasattr(obj.listing, 'seller'):
            if obj.listing.seller and obj.listing.seller.user == request.user:
                return True

        # Listing owner can access
        if obj.listing and obj.listing.owner == request.user:
            return True

        return False


class CanConfirmBooking(permissions.BasePermission):
    """
    Permission: Only sellers/providers can confirm bookings.
    """
    def has_object_permission(self, request, view, obj):
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Seller of listing can confirm
        if obj.listing:
            if hasattr(obj.listing, 'seller') and obj.listing.seller:
                if obj.listing.seller.user == request.user:
                    return True

            # Listing owner can confirm
            if obj.listing.owner == request.user:
                return True

        # Service provider can confirm
        if hasattr(obj, 'service') and obj.service.service_provider:
            if obj.service.service_provider.user == request.user:
                return True

        # Appointment provider can confirm
        if hasattr(obj, 'appointment') and obj.appointment.service_provider:
            if obj.appointment.service_provider.user == request.user:
                return True

        # Staff can always confirm
        return request.user.is_staff


class CanCancelBooking(permissions.BasePermission):
    """
    Permission: Owner can cancel, seller can cancel based on policy.
    """
    def has_object_permission(self, request, view, obj):
        # Booking owner can cancel if policy allows
        if obj.user == request.user:
            return obj.can_cancel

        # Seller can cancel (with penalty if needed)
        if obj.listing:
            if hasattr(obj.listing, 'seller') and obj.listing.seller:
                if obj.listing.seller.user == request.user:
                    return True

            if obj.listing.owner == request.user:
                return True

        # Service provider can cancel
        if hasattr(obj, 'service') and obj.service.service_provider:
            if obj.service.service_provider.user == request.user:
                return True

        # Staff can always cancel
        return request.user.is_staff


class CanReviewBooking(permissions.BasePermission):
    """
    Permission: Only booking owner can review after completion.
    """
    def has_object_permission(self, request, view, obj):
        # Must be booking owner
        if obj.user != request.user:
            return False

        # Booking must be completed
        if obj.status != 'completed':
            return False

        # Can't review if already reviewed
        if hasattr(obj, 'review'):
            return False

        return True


class IsServiceProvider(permissions.BasePermission):
    """
    Permission: User must have a business profile (service provider).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has business profile
        return hasattr(request.user, 'business_profile')
