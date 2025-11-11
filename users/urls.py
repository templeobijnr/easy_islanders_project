from django.urls import path
from .views import (
    SignupView, LoginView, LogoutView, UserProfileView,
    GoogleAuthView, FacebookAuthView, UserPreferencesView,
    ChangePasswordView, DeleteAccountView
)

urlpatterns = [
    path('auth/register/', SignupView.as_view(), name='signup'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('auth/facebook/', FacebookAuthView.as_view(), name='facebook-auth'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('auth/delete-account/', DeleteAccountView.as_view(), name='delete-account'),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('auth/preferences/', UserPreferencesView.as_view(), name='user-preferences'),
]
