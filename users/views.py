from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import models
from .models import BusinessProfile, UserPreference
import requests
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

User = get_user_model()


class SignupView(APIView):
    """User signup endpoint"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        data = request.data
        user_type = data.get('user_type', 'consumer')
        
        # Validate required fields
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return Response(
                {'error': 'username, email, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate input
        if User.objects.filter(username=data.get('username')).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=data.get('email')).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        try:
            user = User.objects.create_user(
                username=data.get('username'),
                email=data.get('email'),
                password=data.get('password'),
                user_type=user_type,
                phone=data.get('phone', '')
            )
            
            # If business user, create profile
            if user_type == 'business':
                BusinessProfile.objects.create(
                    user=user,
                    business_name=data.get('business_name', ''),
                    contact_phone=data.get('contact_phone', ''),
                    description=data.get('description', '')
                )
            
            # Generate token
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'user_type': user.user_type,
                },
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'message': 'Signup successful. Business users require admin verification.'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        identifier = (request.data.get('email') or request.data.get('username') or '').strip()
        password = (request.data.get('password') or '').strip()

        if not identifier or not password:
            return Response(
                {'error': 'email/username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Allow login by email or username (case-insensitive)
        try:
            user = User.objects.filter(models.Q(email__iexact=identifier) | models.Q(username__iexact=identifier)).first()
            if not user:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

            if not user.is_active:
                return Response({'error': 'Account disabled'}, status=status.HTTP_403_FORBIDDEN)

            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response({
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'user_type': user.user_type,
                        'is_verified': getattr(user, 'is_verified', False),
                        'business_verified': getattr(getattr(user, 'business_profile', None), 'is_verified_by_admin', False),
                    },
                    'token': str(refresh.access_token),
                    'refresh': str(refresh)
                }, status=status.HTTP_200_OK)

            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': 'Login failed'}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )


class UserProfileView(APIView):
    """Get and update current user's profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type,
            'phone': user.phone,
        }

        # Include business profile if exists
        if hasattr(user, 'business_profile'):
            profile = user.business_profile
            data['business_profile'] = {
                'business_name': profile.business_name,
                'is_verified_by_admin': profile.is_verified_by_admin,
            }

        return Response(data, status=status.HTTP_200_OK)

    def put(self, request):
        """Update user profile"""
        user = request.user
        data = request.data

        # Update allowed fields
        if 'username' in data:
            # Check if username is already taken by another user
            if User.objects.exclude(id=user.id).filter(username=data['username']).exists():
                return Response(
                    {'error': 'Username already taken'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.username = data['username']

        if 'email' in data:
            # Check if email is already taken by another user
            if User.objects.exclude(id=user.id).filter(email=data['email']).exists():
                return Response(
                    {'error': 'Email already taken'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.email = data['email']

        if 'phone' in data:
            user.phone = data['phone']

        try:
            user.save()

            # If business user, update business profile
            if user.user_type == 'business' and hasattr(user, 'business_profile'):
                business_data = data.get('business_profile', {})
                if business_data:
                    business_profile = user.business_profile
                    if 'business_name' in business_data:
                        business_profile.business_name = business_data['business_name']
                    if 'description' in business_data:
                        business_profile.description = business_data['description']
                    if 'contact_phone' in business_data:
                        business_profile.contact_phone = business_data['contact_phone']
                    if 'website' in business_data:
                        business_profile.website = business_data['website']
                    if 'location' in business_data:
                        business_profile.location = business_data['location']
                    business_profile.save()

            return Response(
                {'message': 'Profile updated successfully'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update profile: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class GoogleAuthView(APIView):
    """Google OAuth2 authentication endpoint"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        token = request.data.get('token')
        user_type = request.data.get('user_type', 'consumer')
        
        if not token:
            return Response(
                {'error': 'token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify Google token
            # In production, use proper client ID from settings
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request())
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            email = idinfo.get('email')
            name = idinfo.get('name', 'Google User')
            picture = idinfo.get('picture', '')
            
            if not email:
                return Response(
                    {'error': 'Email not provided by Google'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create or get user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0] + '_google',
                    'first_name': name.split(' ')[0] if name else 'Google',
                    'last_name': name.split(' ')[-1] if len(name.split(' ')) > 1 else 'User',
                    'user_type': user_type,
                }
            )
            
            # If business user and newly created, create profile
            if user_type == 'business' and created:
                BusinessProfile.objects.create(
                    user=user,
                    business_name=name,
                    contact_phone='',
                    description='Social auth user'
                )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'user_type': user.user_type,
                },
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'created': created,
                'message': 'Google authentication successful'
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
        except ValueError as e:
            return Response(
                {'error': f'Invalid token: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Authentication failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class FacebookAuthView(APIView):
    """Facebook OAuth2 authentication endpoint"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        access_token = request.data.get('access_token')
        user_type = request.data.get('user_type', 'consumer')
        
        if not access_token:
            return Response(
                {'error': 'access_token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify Facebook token by fetching user info
            fb_url = 'https://graph.facebook.com/me'
            params = {
                'access_token': access_token,
                'fields': 'id,name,email,picture'
            }
            
            response = requests.get(fb_url, params=params)
            
            if response.status_code != 200:
                return Response(
                    {'error': 'Invalid Facebook token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            fb_data = response.json()
            email = fb_data.get('email')
            name = fb_data.get('name', 'Facebook User')
            picture_url = fb_data.get('picture', {}).get('data', {}).get('url', '')
            
            if not email:
                return Response(
                    {'error': 'Email not provided by Facebook'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create or get user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0] + '_facebook',
                    'first_name': name.split(' ')[0] if name else 'Facebook',
                    'last_name': name.split(' ')[-1] if len(name.split(' ')) > 1 else 'User',
                    'user_type': user_type,
                }
            )
            
            # If business user and newly created, create profile
            if user_type == 'business' and created:
                BusinessProfile.objects.create(
                    user=user,
                    business_name=name,
                    contact_phone='',
                    description='Social auth user'
                )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'user_type': user.user_type,
                },
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'created': created,
                'message': 'Facebook authentication successful'
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Authentication failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserPreferencesView(APIView):
    """Get and update user preferences (UI settings and extracted preferences)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user preferences"""
        user = request.user
        
        # Get UI preference defaults
        ui_preferences = {}
        for pref_type in ['ui_language', 'ui_currency', 'ui_timezone', 'ui_email_notifications', 
                          'ui_push_notifications', 'ui_marketing_notifications']:
            pref = UserPreference.objects.filter(user=user, preference_type=pref_type).first()
            if pref:
                ui_preferences[pref_type] = pref.value
        
        # Get extracted preferences
        extracted_preferences = {}
        for pref_type in ['extracted_real_estate', 'extracted_services', 'extracted_lifestyle', 'extracted_general']:
            prefs = UserPreference.objects.filter(user=user, preference_type=pref_type).values('id', 'value', 'confidence')
            if prefs.exists():
                extracted_preferences[pref_type] = list(prefs)
        
        return Response({
            'ui_settings': ui_preferences,
            'extracted_preferences': extracted_preferences,
        }, status=status.HTTP_200_OK)

    def put(self, request):
        """Update user preferences"""
        user = request.user
        data = request.data

        try:
            # Update UI settings
            ui_settings = data.get('ui_settings', {})
            for pref_type, value in ui_settings.items():
                if pref_type.startswith('ui_'):
                    UserPreference.objects.update_or_create(
                        user=user,
                        preference_type=pref_type,
                        defaults={
                            'value': value,
                            'source': 'explicit',
                        }
                    )
            
            return Response(
                {'message': 'Preferences updated successfully'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update preferences: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ChangePasswordView(APIView):
    """Change user password"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Change password"""
        user = request.user
        data = request.data

        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'error': 'Both current_password and new_password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check current password
        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new password length
        if len(new_password) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user.set_password(new_password)
            user.save()
            return Response(
                {'message': 'Password changed successfully'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to change password: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class DeleteAccountView(APIView):
    """Delete user account"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        """Delete user account permanently"""
        user = request.user
        password = request.data.get('password')

        if not password:
            return Response(
                {'error': 'Password is required to delete account'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify password before deleting
        if not user.check_password(password):
            return Response(
                {'error': 'Incorrect password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            username = user.username
            user.delete()
            return Response(
                {'message': f'Account {username} has been permanently deleted'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete account: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
