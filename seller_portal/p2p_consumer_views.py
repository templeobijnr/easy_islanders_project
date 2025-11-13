"""
P2P Consumer API endpoints - allows regular users to create and manage P2P posts
"""

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from listings.models import Listing, Category
from bookings.models import Booking


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_p2p_posts(request):
    """
    GET /api/p2p/my-posts/
    Get all P2P posts created by the current user (consumer)
    
    Returns:
        [
            {
                'id': 'uuid',
                'title': 'Post Title',
                'description': '...',
                'price': 100.00,
                'status': 'active',
                'exchange_type': 'service_exchange',
                'condition': 'new',
                'created_at': '2025-11-12T...',
                'image_url': '...',
                'location': '...',
                'exchanges_count': 5,
            }
        ]
    """
    try:
        category = Category.objects.get(slug='p2p')
    except Category.DoesNotExist:
        category, _ = Category.objects.get_or_create(
            slug='p2p',
            defaults={'name': 'P2P', 'is_bookable': True}
        )
    
    listings = Listing.objects.filter(
        owner=request.user,
        category=category
    ).order_by('-created_at')
    
    posts = []
    for listing in listings:
        exchanges = Booking.objects.filter(listing=listing)
        posts.append({
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price) if listing.price else 0,
            'status': listing.status,
            'exchange_type': listing.dynamic_fields.get('exchange_type') if listing.dynamic_fields else None,
            'condition': listing.dynamic_fields.get('condition') if listing.dynamic_fields else None,
            'created_at': listing.created_at.isoformat(),
            'image_url': listing.images.first().image.url if listing.images.exists() else None,
            'location': listing.location or '',
            'exchanges_count': exchanges.count(),
        })
    
    return Response(posts)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_p2p_post(request):
    """
    POST /api/p2p/posts/create/
    Create a new P2P post
    
    Body:
        {
            'title': 'Looking for...',
            'description': 'I have...',
            'price': 0.00,
            'location': 'City, Country',
            'exchange_type': 'service_exchange',
            'condition': 'new'
        }
    """
    try:
        category = Category.objects.get(slug='p2p')
    except Category.DoesNotExist:
        category, _ = Category.objects.get_or_create(
            slug='p2p',
            defaults={'name': 'P2P', 'is_bookable': True}
        )
    
    try:
        listing = Listing.objects.create(
            owner=request.user,
            category=category,
            title=request.data.get('title'),
            description=request.data.get('description', ''),
            price=request.data.get('price', 0.0),
            currency=request.data.get('currency', 'EUR'),
            status='active',
            location=request.data.get('location', ''),
            dynamic_fields={
                'exchange_type': request.data.get('exchange_type'),
                'condition': request.data.get('condition', 'good'),
            }
        )
        
        return Response({
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
            'created_at': listing.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def p2p_post_detail(request, post_id):
    """
    GET /api/p2p/posts/{post_id}/
    Get details of a specific P2P post
    """
    try:
        listing = Listing.objects.get(
            id=post_id,
            owner=request.user,
            category__slug='p2p'
        )
        
        exchanges = Booking.objects.filter(listing=listing)
        
        return Response({
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price) if listing.price else 0,
            'currency': listing.currency,
            'status': listing.status,
            'location': listing.location or '',
            'exchange_type': listing.dynamic_fields.get('exchange_type') if listing.dynamic_fields else None,
            'condition': listing.dynamic_fields.get('condition') if listing.dynamic_fields else None,
            'created_at': listing.created_at.isoformat(),
            'updated_at': listing.updated_at.isoformat(),
            'image_url': listing.images.first().image.url if listing.images.exists() else None,
            'exchanges_count': exchanges.count(),
            'active_exchanges': exchanges.filter(status='confirmed').count(),
        })
    
    except Listing.DoesNotExist:
        return Response(
            {'error': 'P2P post not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_p2p_post(request, post_id):
    """
    PUT/PATCH /api/p2p/posts/{post_id}/
    Update a P2P post
    """
    try:
        listing = Listing.objects.get(
            id=post_id,
            owner=request.user,
            category__slug='p2p'
        )
        
        # Update allowed fields
        allowed_fields = ['title', 'description', 'price', 'status', 'location', 'dynamic_fields']
        for key, value in request.data.items():
            if key in allowed_fields and hasattr(listing, key):
                setattr(listing, key, value)
        
        listing.save()
        
        return Response({
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
            'updated_at': listing.updated_at.isoformat(),
        })
    
    except Listing.DoesNotExist:
        return Response(
            {'error': 'P2P post not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_p2p_post(request, post_id):
    """
    DELETE /api/p2p/posts/{post_id}/
    Delete a P2P post
    """
    try:
        listing = Listing.objects.get(
            id=post_id,
            owner=request.user,
            category__slug='p2p'
        )
        
        listing_id = str(listing.id)
        listing.delete()
        
        return Response({
            'message': 'P2P post deleted successfully',
            'id': listing_id,
        })
    
    except Listing.DoesNotExist:
        return Response(
            {'error': 'P2P post not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def browse_p2p_posts(request):
    """
    GET /api/p2p/browse/?location=&exchange_type=&condition=
    Browse all P2P posts (public listing)
    
    Query params:
        location: filter by location
        exchange_type: filter by exchange type
        condition: filter by condition
        status: filter by status (default: active)
    """
    try:
        category = Category.objects.get(slug='p2p')
    except Category.DoesNotExist:
        return Response([])
    
    # Start with active posts
    status_filter = request.query_params.get('status', 'active')
    listings = Listing.objects.filter(
        category=category,
        status=status_filter
    ).exclude(owner=request.user)  # Don't show own posts
    
    # Apply filters
    location = request.query_params.get('location')
    if location:
        listings = listings.filter(location__icontains=location)
    
    exchange_type = request.query_params.get('exchange_type')
    if exchange_type:
        listings = listings.filter(dynamic_fields__exchange_type=exchange_type)
    
    condition = request.query_params.get('condition')
    if condition:
        listings = listings.filter(dynamic_fields__condition=condition)
    
    posts = []
    for listing in listings.order_by('-created_at'):
        exchanges = Booking.objects.filter(listing=listing)
        posts.append({
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description[:200],  # Truncate for browse
            'price': float(listing.price) if listing.price else 0,
            'exchange_type': listing.dynamic_fields.get('exchange_type') if listing.dynamic_fields else None,
            'condition': listing.dynamic_fields.get('condition') if listing.dynamic_fields else None,
            'location': listing.location or '',
            'created_at': listing.created_at.isoformat(),
            'image_url': listing.images.first().image.url if listing.images.exists() else None,
            'seller_name': listing.owner.get_full_name() or listing.owner.username,
            'exchanges_count': exchanges.count(),
        })
    
    return Response(posts)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def propose_exchange(request, post_id):
    """
    POST /api/p2p/posts/{post_id}/propose-exchange/
    Propose an exchange for a P2P post
    
    Body:
        {
            'contact_name': 'Your Name',
            'contact_email': 'your@email.com',
            'contact_phone': '+1234567890',
            'message': 'I am interested in...',
            'proposed_exchange': 'I can offer...',
        }
    """
    try:
        listing = Listing.objects.get(
            id=post_id,
            category__slug='p2p'
        )
        
        # Create a booking as exchange proposal
        booking = Booking.objects.create(
            listing=listing,
            user=request.user,
            contact_name=request.data.get('contact_name', request.user.get_full_name() or request.user.username),
            contact_email=request.data.get('contact_email', request.user.email),
            contact_phone=request.data.get('contact_phone', ''),
            status='pending',
            notes=request.data.get('message', ''),
            dynamic_fields={
                'proposed_exchange': request.data.get('proposed_exchange'),
            }
        )
        
        return Response({
            'id': str(booking.id),
            'status': booking.status,
            'created_at': booking.created_at.isoformat(),
            'message': 'Exchange proposal sent successfully',
        }, status=status.HTTP_201_CREATED)
    
    except Listing.DoesNotExist:
        return Response(
            {'error': 'P2P post not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_exchange_proposals(request):
    """
    GET /api/p2p/my-proposals/
    Get all exchange proposals received by the user (as post owner)
    """
    # Get all bookings for listings owned by this user
    proposals = Booking.objects.filter(
        listing__owner=request.user,
        listing__category__slug='p2p'
    ).order_by('-created_at')
    
    data = []
    for proposal in proposals:
        data.append({
            'id': str(proposal.id),
            'post_id': str(proposal.listing.id),
            'post_title': proposal.listing.title,
            'proposer_name': proposal.user.get_full_name() or proposal.user.username,
            'proposer_email': proposal.user.email,
            'status': proposal.status,
            'message': proposal.notes,
            'proposed_exchange': proposal.dynamic_fields.get('proposed_exchange') if proposal.dynamic_fields else None,
            'created_at': proposal.created_at.isoformat(),
        })
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_proposal(request, proposal_id):
    """
    POST /api/p2p/proposals/{proposal_id}/respond/
    Respond to an exchange proposal (accept/reject)
    
    Body:
        {
            'action': 'accept' or 'reject',
            'message': 'Optional response message'
        }
    """
    try:
        booking = Booking.objects.get(
            id=proposal_id,
            listing__owner=request.user,
            listing__category__slug='p2p'
        )
        
        action = request.data.get('action', 'reject')
        
        if action == 'accept':
            booking.status = 'confirmed'
        elif action == 'reject':
            booking.status = 'cancelled'
        else:
            return Response(
                {'error': 'Invalid action. Use "accept" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.save()
        
        return Response({
            'id': str(booking.id),
            'status': booking.status,
            'updated_at': booking.updated_at.isoformat(),
            'message': f'Proposal {action}ed successfully',
        })
    
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Proposal not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
