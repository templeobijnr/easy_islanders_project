from rest_framework.permissions import BasePermission


class IsAgentService(BasePermission):
    """Allows access only to the agent service account (or any user with the explicit permission)."""

    required_perm = 'assistant.can_broadcast_to_all_sellers'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return user.has_perm(self.required_perm)


class IsBusinessUser(BasePermission):
    """Allows access only to business users."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        # Users app defines user_type field
        return getattr(user, 'user_type', None) == 'business'


class IsAgentService(BasePermission):
    """Allows access only to the agent service account (or any user with the explicit permission)."""

    required_perm = 'assistant.can_broadcast_to_all_sellers'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return user.has_perm(self.required_perm)


class IsBusinessUser(BasePermission):
    """Allows access only to business users."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        # Users app defines user_type field
        return getattr(user, 'user_type', None) == 'business'
