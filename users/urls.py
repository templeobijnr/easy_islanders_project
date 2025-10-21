from django.urls import path
from .views import SignupView, LoginView, LogoutView, UserProfileView, GoogleAuthView, FacebookAuthView

urlpatterns = [
    path('auth/register/', SignupView.as_view(), name='signup'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('auth/facebook/', FacebookAuthView.as_view(), name='facebook-auth'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]
