from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import BusinessProfile
import requests
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

User = get_user_model()


class SignupView(APIView):
    """User signup endpoint"""
    permission_classes = [AllowAny]
    
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
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to authenticate with email
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'user_type': user.user_type,
                    },
                    'token': str(refresh.access_token),
                    'refresh': str(refresh)
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )


class UserProfileView(APIView):
    """Get current user's profile"""
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


class GoogleAuthView(APIView):
    """Google OAuth2 authentication endpoint"""
    permission_classes = [AllowAny]
    
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
