"""
Simple authentication system for Easy Islanders.
Handles user registration, login, and session management.
"""

import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user."""
    try:
        data = request.data
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        phone = data.get('phone', '').strip()
        
        if not username or not email or not password:
            return Response({
                'error': 'Username, email, and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Create user profile
        from .models import UserProfile
        profile = UserProfile.objects.create(
            user_id=str(user.id),
            preferred_language=data.get('language', 'en'),
            current_location=data.get('location', ''),
            living_status=data.get('living_status', ''),
            family_situation=data.get('family_situation', ''),
            work_situation=data.get('work_situation', '')
        )
        
        # Auto-login after registration
        login(request, user)
        
        return Response({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user.id,
            'username': user.username,
            'profile_id': profile.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return Response({
            'error': 'Registration failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login a user."""
    try:
        data = request.data
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return Response({
                'error': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            login(request, user)
            
            # Get user profile
            from .models import UserProfile
            try:
                profile = UserProfile.objects.get(user_id=str(user.id))
                profile_data = {
                    'preferred_language': profile.preferred_language,
                    'current_location': profile.current_location,
                    'living_status': profile.living_status,
                    'family_situation': profile.family_situation,
                    'work_situation': profile.work_situation
                }
            except UserProfile.DoesNotExist:
                profile_data = {}
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'user_id': user.id,
                'username': user.username,
                'profile': profile_data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        return Response({
            'error': 'Login failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_user(request):
    """Logout a user."""
    try:
        logout(request)
        return Response({
            'success': True,
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return Response({
            'error': 'Logout failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_user_profile(request):
    """Get current user's profile."""
    try:
        if not request.user.is_authenticated:
            return Response({
                'error': 'User not authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        from .models import UserProfile
        try:
            profile = UserProfile.objects.get(user_id=str(request.user.id))
            return Response({
                'user_id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'profile': {
                    'preferred_language': profile.preferred_language,
                    'current_location': profile.current_location,
                    'living_status': profile.living_status,
                    'family_situation': profile.family_situation,
                    'work_situation': profile.work_situation,
                    'total_interactions': profile.total_interactions,
                    'last_interaction': profile.last_interaction
                }
            }, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'User profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        return Response({
            'error': 'Failed to get profile'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_user_profile(request):
    """Update user's profile."""
    try:
        if not request.user.is_authenticated:
            return Response({
                'error': 'User not authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        from .models import UserProfile
        profile, created = UserProfile.objects.get_or_create(
            user_id=str(request.user.id),
            defaults={'preferred_language': 'en'}
        )
        
        data = request.data
        if 'preferred_language' in data:
            profile.preferred_language = data['preferred_language']
        if 'current_location' in data:
            profile.current_location = data['current_location']
        if 'living_status' in data:
            profile.living_status = data['living_status']
        if 'family_situation' in data:
            profile.family_situation = data['family_situation']
        if 'work_situation' in data:
            profile.work_situation = data['work_situation']
        
        profile.save()
        
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'profile': {
                'preferred_language': profile.preferred_language,
                'current_location': profile.current_location,
                'living_status': profile.living_status,
                'family_situation': profile.family_situation,
                'work_situation': profile.work_situation
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        return Response({
            'error': 'Failed to update profile'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def check_auth_status(request):
    """Check if user is authenticated."""
    return Response({
        'authenticated': request.user.is_authenticated,
        'user_id': request.user.id if request.user.is_authenticated else None,
        'username': request.user.username if request.user.is_authenticated else None
    }, status=status.HTTP_200_OK)


