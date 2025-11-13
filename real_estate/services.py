from __future__ import annotations

from typing import Optional
from django.contrib.auth import get_user_model
from django.db import transaction

from listings.models import Listing as GenericListing, Category
from .models import Listing as REListing


@transaction.atomic
def ensure_listing_for_property(property_obj: REListing, owner: Optional[object] = None) -> GenericListing:
    """
    Ensure a cross-domain listings.Listing exists and is linked to the given
    real_estate Listing (property).

    Parameters:
    - property_obj: real_estate.models.Listing instance
    - owner: User instance (required if property_obj does not carry ownership)

    Returns: listings.models.Listing
    """
    # If listing exists, sync and return
    if property_obj.listing:
        generic = property_obj.listing
        # Sync key fields
        generic.title = property_obj.title
        generic.description = property_obj.description or ''
        generic.price = property_obj.monthly_price or property_obj.nightly_price
        generic.currency = str(property_obj.currency or 'EUR')
        generic.location = property_obj.city
        generic.latitude = float(property_obj.lat) if property_obj.lat is not None else None
        generic.longitude = float(property_obj.lng) if property_obj.lng is not None else None
        generic.transaction_type = _infer_transaction_type(property_obj)
        # Update dynamic fields
        generic.dynamic_fields = {
            'rent_type': property_obj.rent_type,
            'bedrooms': property_obj.bedrooms,
            'bathrooms': float(property_obj.bathrooms) if property_obj.bathrooms is not None else None,
            'property_type': property_obj.property_type,
        }
        generic.save()
        return generic

    # Determine owner (required by Generic Listing model)
    if owner is None:
        # Try best-effort discovery (some deployments may add an owner attr later)
        prop_owner = getattr(property_obj, 'owner', None)
        if prop_owner is None:
            raise ValueError("Owner is required to create a generic Listing for real estate property")
        owner = prop_owner

    # Resolve the Real Estate domain/category
    domain_slug = 'real-estate'
    try:
        domain_category = Category.objects.get(slug=domain_slug)
    except Category.DoesNotExist:
        raise Category.DoesNotExist("Category with slug 'real-estate' not found. Seed categories before linking.")

    # Create the generic listing wrapper
    generic = GenericListing.objects.create(
        owner=owner,
        category=domain_category,
        domain=domain_slug,
        title=property_obj.title,
        description=property_obj.description or '',
        price=property_obj.monthly_price or property_obj.nightly_price,
        currency=str(property_obj.currency or 'EUR'),
        location=property_obj.city,
        latitude=float(property_obj.lat) if property_obj.lat is not None else None,
        longitude=float(property_obj.lng) if property_obj.lng is not None else None,
        transaction_type=_infer_transaction_type(property_obj),
        listing_kind='offer',
        # Optional attributes to hint transaction mode
        dynamic_fields={
            'rent_type': property_obj.rent_type,
            'bedrooms': property_obj.bedrooms,
            'bathrooms': float(property_obj.bathrooms) if property_obj.bathrooms is not None else None,
            'property_type': property_obj.property_type,
        },
        status='active',
        is_featured=False,
    )

    # Link back
    property_obj.listing = generic
    property_obj.save(update_fields=['listing'])
    return generic


def _infer_transaction_type(property_obj: REListing) -> str:
    if property_obj.rent_type == 'short_term':
        return 'rent_short'
    if property_obj.rent_type == 'long_term':
        return 'rent_long'
    if property_obj.rent_type == 'both':
        return 'rent_long'  # default bias
    return 'sale'
