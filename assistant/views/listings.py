from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from listings.models import Category, Subcategory, Listing

User = get_user_model()


class CategoriesListView(APIView):
    """Get all categories or featured categories only"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        featured_only = request.query_params.get('featured_only', 'false').lower() == 'true'
        
        if featured_only:
            categories = Category.objects.filter(is_featured_category=True)
        else:
            categories = Category.objects.all()
        
        data = [{
            'id': cat.id,
            'slug': cat.slug,
            'name': cat.name,
            'is_featured_category': cat.is_featured_category,
            'display_order': cat.display_order,
        } for cat in categories]
        
        return Response(data, status=status.HTTP_200_OK)


class SubcategoriesListView(APIView):
    """Get subcategories for a specific category"""
    permission_classes = [AllowAny]
    
    def get(self, request, category_slug):
        category = get_object_or_404(Category, slug=category_slug)
        subcategories = category.subcategories.all()
        
        data = [{
            'id': subcat.id,
            'slug': subcat.slug,
            'name': subcat.name,
            'display_order': subcat.display_order,
        } for subcat in subcategories]
        
        return Response(data, status=status.HTTP_200_OK)


class ListingCreateView(APIView):
    """Create a new listing"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        data = request.data
        
        # RBAC check
        if user.user_type != 'business':
            return Response(
                {'error': 'Only business users can create listings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if business profile exists and is verified
        if not hasattr(user, 'business_profile') or not user.business_profile:
            return Response(
                {'error': 'Business profile not found. Please complete your profile setup.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not user.business_profile.is_verified_by_admin:
            return Response(
                {'error': 'Your business profile must be verified by admin'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate required fields
        required_fields = ['title', 'price', 'category']
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {'error': f'{field} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get category
        try:
            category = Category.objects.get(slug=data.get('category'))
        except Category.DoesNotExist:
            return Response(
                {'error': 'Invalid category'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get subcategory if provided
        subcategory = None
        if data.get('subcategory'):
            try:
                subcategory = Subcategory.objects.get(slug=data.get('subcategory'))
            except Subcategory.DoesNotExist:
                pass
        
        # Create listing
        try:
            listing = Listing.objects.create(
                owner=user,
                title=data.get('title'),
                description=data.get('description', ''),
                category=category,
                subcategory=subcategory,
                price=data.get('price'),
                currency=data.get('currency', 'EUR'),
                location=data.get('location', ''),
                dynamic_fields=self._extract_dynamic_fields(data)
            )
            
            return Response({
                'id': str(listing.id),
                'title': listing.title,
                'price': float(listing.price),
                'category': listing.category.slug,
                'status': listing.status,
                'message': 'Listing created successfully'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _extract_dynamic_fields(self, data):
        """Extract dynamic fields based on category"""
        exclude_fields = {'title', 'description', 'category', 'subcategory', 'price', 'currency', 'location'}
        dynamic = {}
        for key, value in data.items():
            if key not in exclude_fields and value:
                dynamic[key] = value
        return dynamic


class ListingDetailView(APIView):
    """Get, update, or delete a specific listing"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, listing_id):
        listing = get_object_or_404(Listing, id=listing_id)
        return Response(self._serialize_listing(listing), status=status.HTTP_200_OK)
    
    def patch(self, request, listing_id):
        listing = get_object_or_404(Listing, id=listing_id)
        
        # RBAC check
        if listing.owner != request.user:
            return Response(
                {'error': 'You can only update your own listings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update fields
        for field in ['title', 'description', 'price', 'currency', 'location']:
            if field in request.data:
                setattr(listing, field, request.data[field])
        
        listing.save()
        
        return Response(self._serialize_listing(listing), status=status.HTTP_200_OK)
    
    def delete(self, request, listing_id):
        listing = get_object_or_404(Listing, id=listing_id)
        
        # RBAC check
        if listing.owner != request.user:
            return Response(
                {'error': 'You can only delete your own listings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        listing.delete()
        
        return Response(
            {'message': 'Listing deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
    
    def _serialize_listing(self, listing):
        return {
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price),
            'currency': listing.currency,
            'category': listing.category.slug if listing.category else None,
            'location': listing.location,
            'status': listing.status,
            'created_at': listing.created_at.isoformat(),
            'dynamic_fields': listing.dynamic_fields,
        }


class MyListingsView(APIView):
    """Get all listings for the current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        listings = Listing.objects.filter(owner=request.user).order_by('-created_at')
        
        data = {
            'listings': [{
                'id': str(listing.id),
                'title': listing.title,
                'description': listing.description,
                'price': float(listing.price),
                'currency': listing.currency,
                'category': {
                    'id': listing.category.id,
                    'name': listing.category.name,
                    'slug': listing.category.slug,
                } if listing.category else None,
                'subcategory': {
                    'id': listing.subcategory.id,
                    'name': listing.subcategory.name,
                    'slug': listing.subcategory.slug,
                } if listing.subcategory else None,
                'location': listing.location,
                'status': listing.status,
                'created_at': listing.created_at.isoformat(),
                'updated_at': listing.updated_at.isoformat(),
            } for listing in listings]
        }
        
        return Response(data, status=status.HTTP_200_OK)


class ImageUploadView(APIView):
    """Upload images for a listing"""
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request, listing_id):
        listing = get_object_or_404(Listing, id=listing_id)
        
        # RBAC check
        if listing.owner != request.user:
            return Response(
                {'error': 'You can only upload images for your own listings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        # Validate image type
        if not image_file.content_type.startswith('image/'):
            return Response(
                {'error': 'File must be an image'},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
            )
        
        # Save image (in production, would use S3/CDN)
        # For now, we'll just acknowledge it
        return Response({
            'message': 'Image uploaded successfully',
            'filename': image_file.name,
        }, status=status.HTTP_201_CREATED)


class ListingPublishView(APIView):
    """Publish or unpublish a listing"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, listing_id):
        listing = get_object_or_404(Listing, id=listing_id)
        
        # RBAC check
        if listing.owner != request.user:
            return Response(
                {'error': 'You can only publish/unpublish your own listings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the new status from request data
        new_status = request.data.get('status')
        if new_status not in ['published', 'draft']:
            return Response(
                {'error': 'Status must be either "published" or "draft"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the listing status
        listing.status = new_status
        listing.save()
        
        return Response({
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
            'message': f'Listing {new_status} successfully'
        }, status=status.HTTP_200_OK)


class ListingDuplicateView(APIView):
    """Duplicate an existing listing"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, listing_id):
        listing = get_object_or_404(Listing, id=listing_id)
        
        # RBAC check
        if listing.owner != request.user:
            return Response(
                {'error': 'You can only duplicate your own listings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create a duplicate listing
        try:
            duplicate = Listing.objects.create(
                owner=listing.owner,
                title=f"{listing.title} (Copy)",
                description=listing.description,
                category=listing.category,
                subcategory=listing.subcategory,
                price=listing.price,
                currency=listing.currency,
                location=listing.location,
                dynamic_fields=listing.dynamic_fields,
                status='draft'  # Always create duplicates as drafts
            )
            
            return Response({
                'id': str(duplicate.id),
                'title': duplicate.title,
                'status': duplicate.status,
                'message': 'Listing duplicated successfully'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
