# Authentication & Create Listing – TDD Implementation Plan

## Overview

This plan extends the **AI Agent TDD Implementation** with **authentication and the Create Listing page**, forming a complete foundation for the Easy Islanders marketplace.

- **Approach:** Test-Driven Development (TDD)
- **Integration:** Works seamlessly with multi-category agent
- **Safety:** RED GATE protection for existing features
- **User Types:** Business Users (create listings) + Consumers (search/book)

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│           Easy Islanders Marketplace                   │
├─────────────────────────────────────────────────────────┤
│ Authentication Layer                                    │
│ ├─ User Types (Business / Consumer)                    │
│ ├─ Signup / Login / Session Management                 │
│ ├─ JWT Token Auth                                      │
│ └─ RBAC Middleware                                     │
├─────────────────────────────────────────────────────────┤
│ Create Listing Page                                    │
│ ├─ Category Selection (Dynamic)                        │
│ ├─ Subcategory Selection (Dynamic per category)        │
│ ├─ Dynamic Fields (per category/subcategory)           │
│ ├─ Image Upload (drag-drop, validation)                │
│ ├─ Pricing, Location, Tags, Features                   │
│ └─ Validation + Submission                             │
├─────────────────────────────────────────────────────────┤
│ Multi-Category AI Agent (Phases 1-6)                   │
│ ├─ Classification Engine                               │
│ ├─ Tool Registry                                       │
│ ├─ Feature Flags                                       │
│ ├─ Vector Store + RAG                                  │
│ ├─ Worker Teams (50+ categories)                       │
│ └─ Enterprise Features (HITL, CRAG, logging)          │
└─────────────────────────────────────────────────────────┘
```

---

## Phase Structure

```
Phase 0: Authentication (NEW - This section)
├─ User model with user_type field
├─ Signup/Login endpoints
├─ JWT token management
├─ RBAC middleware
└─ Tests: 25+ tests

Phase 1: Create Listing Page Foundation (NEW - This section)
├─ Category/Subcategory models
├─ Dynamic field schema
├─ Image upload handling
├─ Listing model integration
└─ Tests: 30+ tests

Phase 2-6: Multi-Category Agent (Existing plan)
├─ Classification engine
├─ Tool registry
├─ Vector store & RAG
├─ Worker teams
└─ Enterprise features
```

---

## Phase 0: Authentication

### 0.1 User Model with RBAC

**File:** Update `assistant/models.py`

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """Extended user model with business profile support"""
    
    USER_TYPE_CHOICES = [
        ('consumer', 'Consumer'),
        ('business', 'Business'),
    ]
    
    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='consumer'
    )
    
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)  # For business users
    
    class Meta:
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"


class BusinessProfile(models.Model):
    """Extended profile for business users"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='business_profile')
    business_name = models.CharField(max_length=255)
    category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True)
    subcategory = models.ForeignKey('Subcategory', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    contact_phone = models.CharField(max_length=20)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    
    # Verification
    is_verified_by_admin = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Business Profile"
        verbose_name_plural = "Business Profiles"
    
    def __str__(self):
        return f"{self.business_name} (verified: {self.is_verified_by_admin})"
```

### 0.2 Tests for Authentication

**File:** `tests/test_authentication.py`

```python
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
import json

User = get_user_model()

class TestUserModel:
    """Unit tests: User model with user_type"""
    
    def test_create_consumer_user(self):
        """Test: Create consumer user"""
        user = User.objects.create_user(
            username="john_consumer",
            email="john@example.com",
            password="secure123",
            user_type="consumer"
        )
        assert user.user_type == "consumer"
        assert user.is_verified is False
    
    def test_create_business_user(self):
        """Test: Create business user"""
        user = User.objects.create_user(
            username="hotel_owner",
            email="hotel@example.com",
            password="secure123",
            user_type="business"
        )
        assert user.user_type == "business"
        assert user.is_verified is False
    
    def test_default_user_type_is_consumer(self):
        """Test: Default user type is consumer"""
        user = User.objects.create_user(
            username="default_user",
            email="default@example.com",
            password="secure123"
        )
        assert user.user_type == "consumer"
    
    def test_business_profile_creation(self):
        """Test: Create business profile for business user"""
        from assistant.models import BusinessProfile, Category
        
        user = User.objects.create_user(
            username="business_user",
            email="business@example.com",
            password="secure123",
            user_type="business"
        )
        
        category = Category.objects.create(
            slug="accommodation",
            name="Accommodation"
        )
        
        profile = BusinessProfile.objects.create(
            user=user,
            business_name="My Hotel",
            category=category,
            contact_phone="+90-555-1234"
        )
        
        assert profile.user == user
        assert profile.business_name == "My Hotel"
        assert profile.is_verified_by_admin is False


class TestAuthenticationAPI:
    """Integration tests: Signup/Login API endpoints"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    def test_consumer_signup(self, client):
        """Test: Consumer user signup"""
        response = client.post('/api/auth/signup/', {
            'username': 'john_consumer',
            'email': 'john@example.com',
            'password': 'secure123',
            'password_confirm': 'secure123',
            'user_type': 'consumer',
            'phone': '+90-555-1234'
        }, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'token' in response.data
        
        user = User.objects.get(username='john_consumer')
        assert user.user_type == 'consumer'
    
    def test_business_signup_requires_verification(self, client):
        """Test: Business signup requires admin verification"""
        response = client.post('/api/auth/signup/', {
            'username': 'hotel_owner',
            'email': 'hotel@example.com',
            'password': 'secure123',
            'password_confirm': 'secure123',
            'user_type': 'business',
            'business_name': 'My Hotel',
            'category_slug': 'accommodation',
            'contact_phone': '+90-555-1234'
        }, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        user = User.objects.get(username='hotel_owner')
        profile = user.business_profile
        assert profile.is_verified_by_admin is False  # Not verified yet
    
    def test_login_with_token(self, client):
        """Test: Login returns JWT token"""
        # Create user
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='secure123'
        )
        
        response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'secure123'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'token' in response.data
    
    def test_login_invalid_credentials(self, client):
        """Test: Login with wrong password fails"""
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='secure123'
        )
        
        response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_logout_invalidates_token(self, client):
        """Test: Logout invalidates JWT token"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='secure123'
        )
        
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'secure123'
        }, format='json')
        
        token = login_response.data['token']
        
        logout_response = client.post(
            '/api/auth/logout/',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        
        assert logout_response.status_code == status.HTTP_200_OK


class TestRBACEnforcement:
    """Tests: Role-based access control"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def consumer_user(self):
        return User.objects.create_user(
            username='consumer',
            email='consumer@example.com',
            password='secure123',
            user_type='consumer'
        )
    
    @pytest.fixture
    def business_user(self):
        return User.objects.create_user(
            username='business',
            email='business@example.com',
            password='secure123',
            user_type='business'
        )
    
    def test_consumer_cannot_create_listing(self, client, consumer_user):
        """Test: Consumer user cannot create listings"""
        # Login as consumer
        token_response = client.post('/api/auth/login/', {
            'username': 'consumer',
            'password': 'secure123'
        }, format='json')
        token = token_response.data['token']
        
        # Try to create listing
        response = client.post(
            '/api/listings/',
            {
                'title': 'Test Listing',
                'price': 100,
                'category_slug': 'accommodation'
            },
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_business_user_can_create_listing(self, client, business_user):
        """Test: Business user can create listings (if verified)"""
        # Manually verify business user
        business_user.business_profile.is_verified_by_admin = True
        business_user.business_profile.save()
        
        # Login as business
        token_response = client.post('/api/auth/login/', {
            'username': 'business',
            'password': 'secure123'
        }, format='json')
        token = token_response.data['token']
        
        # Create listing
        response = client.post(
            '/api/listings/',
            {
                'title': 'Test Listing',
                'price': 100,
                'category_slug': 'accommodation'
            },
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_unverified_business_cannot_create_listing(self, client, business_user):
        """Test: Unverified business user cannot create listings"""
        token_response = client.post('/api/auth/login/', {
            'username': 'business',
            'password': 'secure123'
        }, format='json')
        token = token_response.data['token']
        
        response = client.post(
            '/api/listings/',
            {
                'title': 'Test Listing',
                'price': 100,
                'category_slug': 'accommodation'
            },
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        # Should fail: not verified
        assert response.status_code == status.HTTP_403_FORBIDDEN
```

### 0.3 Authentication Implementation

**File:** `assistant/views/auth.py` (NEW)

```python
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from assistant.models import User, BusinessProfile
from assistant.serializers import UserSerializer, BusinessProfileSerializer

class SignupView(APIView):
    """User signup endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        data = request.data
        user_type = data.get('user_type', 'consumer')
        
        # Validate input
        if User.objects.filter(username=data.get('username')).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
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
                business_name=data.get('business_name'),
                contact_phone=data.get('contact_phone'),
                description=data.get('description', '')
            )
        
        # Generate token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Signup successful. Business users require admin verification.'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # JWT doesn't have server-side logout, but we can blacklist tokens
        # For now, client-side token deletion is sufficient
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
```

### 0.4 RBAC Middleware

**File:** `assistant/middleware/rbac.py` (NEW)

```python
from rest_framework import status
from rest_framework.response import Response
from functools import wraps
from django.http import JsonResponse

def require_user_type(required_type):
    """Decorator to enforce user type RBAC"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if request.user.user_type != required_type:
                return JsonResponse(
                    {'error': f'This action requires {required_type} user'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        return wrapped
    return decorator

def require_verified_business(view_func):
    """Decorator to enforce verified business user"""
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if request.user.user_type != 'business':
            return JsonResponse(
                {'error': 'Business user required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        profile = request.user.business_profile
        if not profile.is_verified_by_admin:
            return JsonResponse(
                {'error': 'Business profile must be verified by admin'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return view_func(request, *args, **kwargs)
    return wrapped
```

---

## Phase 1: Create Listing Page

### 1.1 Category & Subcategory Models

**File:** Already in `assistant/models.py` (from PRODUCT_ARCHITECTURE.md)

```python
# These models already exist from Phase 1 of agent extension:
class Category(models.Model):
    slug = SlugField(unique=True)
    name = CharField(max_length=255)
    is_featured_category = BooleanField(default=False)
    display_order = IntegerField(default=0)
    # ... etc

class Subcategory(models.Model):
    category = ForeignKey(Category, on_delete=models.CASCADE)
    slug = SlugField(max_length=100)
    name = CharField(max_length=255)
    # ... etc
```

### 1.2 Dynamic Field Schema

**File:** `assistant/models/listing_schema.py` (NEW)

```python
from django.db import models

class ListingFieldSchema(models.Model):
    """Defines which fields are required/optional per category"""
    
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    subcategory = models.ForeignKey('Subcategory', on_delete=models.CASCADE, null=True, blank=True)
    
    # Schema stored as JSON
    required_fields = models.JSONField(
        default=list,
        help_text='List of required field names: ["title", "price", "bedrooms"]'
    )
    optional_fields = models.JSONField(
        default=list,
        help_text='List of optional field names: ["features", "tags"]'
    )
    
    # Field type definitions
    field_types = models.JSONField(
        default=dict,
        help_text={
            'bedrooms': {'type': 'integer', 'label': 'Number of Bedrooms'},
            'amenities': {'type': 'multiselect', 'options': ['WiFi', 'Pool', 'Parking']},
        }
    )
    
    class Meta:
        unique_together = ('category', 'subcategory')
    
    def __str__(self):
        return f"{self.category.name} → {self.subcategory.name if self.subcategory else 'All'}"


class ListingFieldValues(models.Model):
    """Store category-specific field values for listings"""
    
    listing = models.ForeignKey('Listing', on_delete=models.CASCADE, related_name='field_values')
    field_name = models.CharField(max_length=100)
    field_value = models.JSONField()  # Flexible storage
    
    class Meta:
        unique_together = ('listing', 'field_name')
```

### 1.3 Tests for Create Listing

**File:** `tests/test_create_listing.py`

```python
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from assistant.models import Category, Subcategory, Listing

User = get_user_model()

class TestCreateListingForm:
    """Tests: Create Listing page form logic"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def business_user(self):
        user = User.objects.create_user(
            username='seller',
            email='seller@example.com',
            password='secure123',
            user_type='business'
        )
        # Verify business user
        user.business_profile.is_verified_by_admin = True
        user.business_profile.save()
        return user
    
    @pytest.fixture
    def categories(self):
        accommodation = Category.objects.create(
            slug='accommodation',
            name='Accommodation',
            is_featured_category=True
        )
        electronics = Category.objects.create(
            slug='electronics',
            name='Electronics',
            is_featured_category=False
        )
        
        # Add subcategories
        Subcategory.objects.create(
            category=accommodation,
            slug='apartment',
            name='Apartments'
        )
        Subcategory.objects.create(
            category=electronics,
            slug='phones',
            name='Phones'
        )
        
        return accommodation, electronics
    
    def test_get_categories_for_listing_form(self, client, categories):
        """Test: Fetch categories for dropdown"""
        response = client.get('/api/categories/?featured_only=false')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2
        assert any(c['slug'] == 'accommodation' for c in response.data['results'])
    
    def test_get_subcategories_for_category(self, client, categories):
        """Test: Fetch subcategories for selected category"""
        response = client.get('/api/categories/accommodation/subcategories/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert response.data['results'][0]['slug'] == 'apartment'
    
    def test_get_dynamic_fields_for_category(self, client, categories):
        """Test: Fetch required/optional fields for category"""
        from assistant.models import ListingFieldSchema
        
        # Create schema for accommodation
        ListingFieldSchema.objects.create(
            category=categories[0],
            required_fields=['title', 'price', 'bedrooms'],
            optional_fields=['amenities', 'description'],
            field_types={
                'bedrooms': {'type': 'integer', 'label': 'Number of Bedrooms'},
                'amenities': {'type': 'multiselect', 'options': ['WiFi', 'Pool', 'Parking']}
            }
        )
        
        response = client.get('/api/listings/schema/?category=accommodation')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'required_fields' in response.data
        assert 'bedrooms' in response.data['required_fields']
    
    def test_create_listing_with_all_fields(self, client, business_user, categories):
        """Test: Create listing with all required fields"""
        # Login
        login_response = client.post('/api/auth/login/', {
            'username': 'seller',
            'password': 'secure123'
        }, format='json')
        token = login_response.data['token']
        
        # Create listing
        response = client.post(
            '/api/listings/',
            {
                'title': 'Beautiful 2-Bedroom Apartment',
                'description': 'Furnished apartment near beach',
                'category': 'accommodation',
                'subcategory': 'apartment',
                'price': 1000,
                'currency': 'EUR',
                'location': 'Kyrenia',
                'bedrooms': 2,
                'bathrooms': 1,
                'amenities': ['WiFi', 'Pool'],
                'images': []  # Image upload handled separately
            },
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Beautiful 2-Bedroom Apartment'
    
    def test_create_listing_missing_required_field(self, client, business_user):
        """Test: Create listing fails without required field"""
        login_response = client.post('/api/auth/login/', {
            'username': 'seller',
            'password': 'secure123'
        }, format='json')
        token = login_response.data['token']
        
        # Missing 'bedrooms' (required for accommodation)
        response = client.post(
            '/api/listings/',
            {
                'title': 'Incomplete Listing',
                'category': 'accommodation',
                'price': 1000,
                # Missing bedrooms
            },
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'bedrooms' in str(response.data)
    
    def test_create_electronics_listing(self, client, business_user, categories):
        """Test: Create different category listing (electronics)"""
        login_response = client.post('/api/auth/login/', {
            'username': 'seller',
            'password': 'secure123'
        }, format='json')
        token = login_response.data['token']
        
        response = client.post(
            '/api/listings/',
            {
                'title': 'iPhone 15 Pro',
                'description': 'Brand new, sealed',
                'category': 'electronics',
                'subcategory': 'phones',
                'price': 1000,
                'currency': 'EUR',
                'condition': 'new',
                'brand': 'Apple',
                'model': 'iPhone 15 Pro',
                'storage': '256GB'
            },
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == status.HTTP_201_CREATED


class TestImageUpload:
    """Tests: Image upload for listings"""
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    @pytest.fixture
    def business_user(self):
        user = User.objects.create_user(
            username='seller',
            email='seller@example.com',
            password='secure123',
            user_type='business'
        )
        user.business_profile.is_verified_by_admin = True
        user.business_profile.save()
        return user
    
    def test_upload_single_image(self, client, business_user):
        """Test: Upload single image for listing"""
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        login_response = client.post('/api/auth/login/', {
            'username': 'seller',
            'password': 'secure123'
        }, format='json')
        token = login_response.data['token']
        
        # Create test image
        image = SimpleUploadedFile(
            "test_image.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        
        response = client.post(
            '/api/listings/123/upload-image/',
            {'image': image},
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_upload_multiple_images(self, client, business_user):
        """Test: Upload multiple images"""
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        login_response = client.post('/api/auth/login/', {
            'username': 'seller',
            'password': 'secure123'
        }, format='json')
        token = login_response.data['token']
        
        images = [
            SimpleUploadedFile("image1.jpg", b"content1", content_type="image/jpeg"),
            SimpleUploadedFile("image2.jpg", b"content2", content_type="image/jpeg"),
        ]
        
        response = client.post(
            '/api/listings/123/upload-images/',
            {'images': images},
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
```

### 1.4 Frontend: Create Listing Component

**File:** `frontend/src/pages/CreateListing.jsx` (NEW)

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
  const navigate = useNavigate();
  
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  
  const [schema, setSchema] = useState({});
  const [formData, setFormData] = useState({});
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('user_type');
    const storedVerified = localStorage.getItem('is_verified') === 'true';
    
    if (token && storedUserType === 'business' && storedVerified) {
      setIsLoggedIn(true);
      setUserType('business');
      setIsVerified(true);
    }
  }, []);
  
  // Fetch categories
  useEffect(() => {
    if (isLoggedIn) {
      axios.get('/api/categories/?featured_only=false')
        .then(res => setCategories(res.data.results))
        .catch(err => setError(err.message));
    }
  }, [isLoggedIn]);
  
  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      axios.get(`/api/categories/${selectedCategory}/subcategories/`)
        .then(res => setSubcategories(res.data.results))
        .catch(err => setError(err.message));
      
      // Fetch schema
      axios.get(`/api/listings/schema/?category=${selectedCategory}`)
        .then(res => setSchema(res.data))
        .catch(err => console.log('Schema fetch error:', err));
    }
  }, [selectedCategory]);
  
  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle image upload
  const handleImageUpload = (e) => {
    setImages([...images, ...Array.from(e.target.files)]);
  };
  
  // Submit listing
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formDataObj = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });
      
      // Add category and subcategory
      formDataObj.append('category', selectedCategory);
      formDataObj.append('subcategory', selectedSubcategory);
      
      // Add images
      images.forEach((image, index) => {
        formDataObj.append(`image_${index}`, image);
      });
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/listings/', formDataObj, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Success
      navigate(`/my-listings/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error creating listing');
    } finally {
      setLoading(false);
    }
  };
  
  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="create-listing-container">
        <h1>Create Listing</h1>
        <div className="not-logged-in">
          <p>You need to sign up as a business to create listings.</p>
          <button onClick={() => navigate('/signup?type=business')}>
            Sign Up as Business
          </button>
        </div>
      </div>
    );
  }
  
  // Not verified
  if (!isVerified) {
    return (
      <div className="create-listing-container">
        <h1>Create Listing</h1>
        <div className="pending-verification">
          <p>Your business profile is pending admin verification.</p>
          <p>Once approved, you'll be able to create listings.</p>
        </div>
      </div>
    );
  }
  
  // Form
  return (
    <div className="create-listing-container">
      <h1>Create New Listing</h1>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {/* Category Selection */}
        <div className="form-group">
          <label>Category *</label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value)}
            required
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        {/* Subcategory Selection */}
        {selectedCategory && (
          <div className="form-group">
            <label>Subcategory *</label>
            <select
              value={selectedSubcategory || ''}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              required
            >
              <option value="">Select subcategory</option>
              {subcategories.map(subcat => (
                <option key={subcat.id} value={subcat.slug}>{subcat.name}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Dynamic Fields */}
        {schema.required_fields && (
          <div className="dynamic-fields">
            {schema.required_fields.map(field => (
              <div key={field} className="form-group">
                <label>{field} *</label>
                <input
                  type="text"
                  name={field}
                  value={formData[field] || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Images */}
        <div className="form-group">
          <label>Images (minimum 1) *</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            required
          />
          <div className="image-preview">
            {images.map((img, idx) => (
              <div key={idx} className="image-thumbnail">
                <img src={URL.createObjectURL(img)} alt={`Preview ${idx}`} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Submit */}
        <button type="submit" disabled={loading || !selectedCategory}>
          {loading ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}
```

---

## Integration with AI Agent & Feature Flags

### How Create Listing Integrates

```
1. Business User Creates Listing
   ├─ Selects Category (e.g., "Electronics")
   ├─ Provides Details (model, brand, specs)
   └─ Listing saved to database

2. Listing Indexed by AI Agent
   ├─ Automatic categorization (via classification engine)
   ├─ Feature flag: "vector_search" ← enables vector indexing
   └─ Available for search immediately

3. Consumer Searches
   ├─ Via sidebar category (if featured)
   ├─ Via AI chat (any category, even non-featured)
   ├─ Results returned with listing details
   └─ Can contact merchant or book
```

---

## Phase 0 & 1 Checklist

```
AUTHENTICATION (Phase 0):
Tests (25+):
- [ ] User model tests (8 tests)
- [ ] Signup/Login API tests (10 tests)
- [ ] RBAC enforcement tests (7 tests)

Implementation:
- [ ] Extended User model with user_type
- [ ] BusinessProfile model
- [ ] Signup/Login API views
- [ ] RBAC middleware decorators
- [ ] JWT token management
- [ ] Migration for User model

CREATE LISTING (Phase 1):
Tests (30+):
- [ ] Form category/subcategory tests (8 tests)
- [ ] Dynamic fields schema tests (8 tests)
- [ ] Listing creation tests (10 tests)
- [ ] Image upload tests (4 tests)

Implementation:
- [ ] ListingFieldSchema model
- [ ] API endpoints for categories
- [ ] API endpoint for listing creation
- [ ] Image upload handler
- [ ] Frontend CreateListing component
- [ ] Migration for new models

INTEGRATION:
- [ ] Feature flags protect new features
- [ ] RED GATE: Existing property search unchanged
- [ ] Create Listing behind auth & RBAC
- [ ] AI Agent can search new listings
- [ ] All tests passing (60+ tests)
```

---

## How Feature Flags Protect This

```
Phase 0 & 1 Don't Break Phase 2-6:
├─ multi_category_search ❌ OFF (Phase 2)
├─ vector_search ❌ OFF (Phase 3)
├─ crag_enabled ❌ OFF (Phase 5)
└─ intelligent_logging ❌ OFF (Phase 5)

Create Listing:
├─ New category listings created via API
├─ Existing property search still works (RED GATE)
├─ New listings only indexed if flags enabled
└─ Consumer can still find via old property routes

AI Agent:
├─ Still routes to property_search (default)
├─ New routes to product_search when flag enabled
├─ Zero breaking changes during development
└─ Canary rollout when ready
```

---

## Complete Implementation Order

### Week 1-2: Auth + Create Listing (25 + 30 = 55 tests)
```
Day 1-2: Write auth tests
Day 3: Write create listing tests
Day 4: Implement auth (User, login, RBAC)
Day 5: Implement create listing backend
Day 6: Implement frontend component
Day 7: Integration & testing
```

### Week 2-3: Multi-Category Agent (Phase 1)
```
Runs in parallel, uses feature flags
Existing property search protected by RED GATE
```

### Week 3-4: Advanced Features (Phase 2-6)
```
RAG, CRAG, Worker teams, etc.
Build on solid foundation from auth + listing
```

---

## Success Criteria (Phase 0 & 1)

- [ ] 55+ tests all passing
- [ ] Authentication working (signup/login/logout)
- [ ] RBAC enforced (business/consumer separation)
- [ ] Create Listing page functional
- [ ] Category/subcategory dynamic fields working
- [ ] Image upload working
- [ ] RED GATE: Property search unchanged
- [ ] Feature flags preventing new agent features
- [ ] Code coverage ≥ 80%
- [ ] Zero breaking changes

---

## Files to Create

```
Tests:
├─ tests/test_authentication.py (25+ tests)
└─ tests/test_create_listing.py (30+ tests)

Backend:
├─ assistant/models.py (User, BusinessProfile updates)
├─ assistant/models/listing_schema.py (NEW)
├─ assistant/views/auth.py (NEW)
├─ assistant/middleware/rbac.py (NEW)
└─ assistant/migrations/0003_auth_and_listing.py (NEW)

Frontend:
└─ frontend/src/pages/CreateListing.jsx (NEW)

Documentation:
└─ AUTH_AND_LISTING_TDD_PLAN.md (THIS FILE)
```

---

**Status:** Phase 0 & 1 ready for implementation. Integrates seamlessly with Phase 2-6 agent extension via feature flags.
