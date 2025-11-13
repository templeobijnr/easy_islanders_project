# Django Apps Quick Reference Guide

**Quick lookup for common queries and patterns**

---

## Quick Model Lookup

| Model | Location | Primary Key | Owner Field | Key Relationships |
|-------|----------|-------------|-------------|-------------------|
| User | users.User | id (auto) | N/A | BusinessProfile, SellerProfile, Listing, Booking, UserPreference |
| BusinessProfile | users.BusinessProfile | id (auto) | user (1:1) | Category, SubCategory |
| UserPreference | users.UserPreference | id (UUID) | user (FK) | User |
| Category | listings.Category | id (UUID) | N/A | SubCategory, Listing, BusinessProfile |
| SubCategory | listings.SubCategory | id (auto) | category (FK) | Listing |
| Listing | listings.Listing | id (UUID) | owner (FK) | Category, SubCategory, ListingImage, Booking |
| ListingImage | listings.ListingImage | id (UUID) | listing (FK) | Listing |
| SellerProfile | listings.SellerProfile | id (UUID) | user (1:1) | User |
| BookingType | bookings.BookingType | id (UUID) | N/A | Booking |
| Booking | bookings.Booking | id (UUID) | user (FK), listing (FK) | User, Listing, BookingType |
| DemandLead | assistant.DemandLead | id (UUID) | user (FK, optional) | User |

---

## Common Query Patterns

### Get Seller's Real Estate Listings
```python
from listings.models import Listing

listings = Listing.objects.filter(
    owner=seller_user,
    category__slug='real_estate'
)
```

### Get Seller's Real Estate Bookings
```python
from bookings.models import Booking

bookings = Booking.objects.filter(
    listing__owner=seller_user,
    listing__category__slug='real_estate'
)
```

### Get Seller's Total Revenue (Real Estate)
```python
from django.db.models import Sum

revenue = Booking.objects.filter(
    listing__owner=seller_user,
    listing__category__slug='real_estate',
    status='confirmed'
).aggregate(total=Sum('total_price'))['total'] or 0
```

### Get Active Listings in Category
```python
listings = Listing.objects.filter(
    category__slug='real_estate',
    status='active'
)
```

### Get Customer's Bookings
```python
bookings = Booking.objects.filter(user=customer_user)
```

### Get Bookings by Status
```python
confirmed = Booking.objects.filter(status='confirmed')
pending = Booking.objects.filter(status='pending')
completed = Booking.objects.filter(status='completed')
```

### Get User's Preferences
```python
preferences = UserPreference.objects.filter(user=user)

# Get specific preference type
language_pref = UserPreference.objects.filter(
    user=user,
    preference_type='ui_language'
).first()
```

### Get Business Profile
```python
business = user.business_profile  # OneToOne
seller = user.seller_profile      # OneToOne
```

---

## Relationship Shortcuts

### From User
```python
user.business_profile           # BusinessProfile (OneToOne)
user.seller_profile             # SellerProfile (OneToOne)
user.listings.all()             # Listing (OneToMany)
user.bookings.all()             # Booking as customer (OneToMany)
user.cancelled_bookings.all()   # Booking as canceller (OneToMany)
user.preferences.all()          # UserPreference (OneToMany)
```

### From Listing
```python
listing.owner                   # User (ForeignKey)
listing.category                # Category (ForeignKey)
listing.subcategory             # SubCategory (ForeignKey)
listing.images.all()            # ListingImage (OneToMany)
listing.bookings.all()          # Booking (OneToMany)
```

### From Booking
```python
booking.user                    # User (customer)
booking.listing                 # Listing
booking.booking_type            # BookingType
booking.cancelled_by            # User (canceller, optional)
```

### From Category
```python
category.subcategories.all()    # SubCategory (OneToMany)
category.listings.all()         # Listing (OneToMany)
```

---

## Filtering by Domain

### Real Estate
```python
# Listings
Listing.objects.filter(category__slug='real_estate')

# Bookings
Booking.objects.filter(listing__category__slug='real_estate')
```

### Events (Future)
```python
# Listings
Listing.objects.filter(category__slug='events')

# Bookings
Booking.objects.filter(listing__category__slug='events')
```

### Activities (Future)
```python
# Listings
Listing.objects.filter(category__slug='activities')

# Bookings
Booking.objects.filter(listing__category__slug='activities')
```

### Appointments (Future)
```python
# Listings
Listing.objects.filter(category__slug='appointments')

# Bookings
Booking.objects.filter(listing__category__slug='appointments')
```

---

## Aggregation Patterns

### Count
```python
from django.db.models import Count

# Total listings
count = Listing.objects.filter(owner=user).count()

# Total bookings
count = Booking.objects.filter(listing__owner=user).count()
```

### Sum
```python
from django.db.models import Sum

# Total revenue
revenue = Booking.objects.filter(
    status='confirmed'
).aggregate(total=Sum('total_price'))['total']
```

### Average
```python
from django.db.models import Avg

# Average booking price
avg = Booking.objects.aggregate(Avg('total_price'))['total_price__avg']
```

### Multiple Aggregations
```python
from django.db.models import Sum, Count, Avg

stats = Booking.objects.filter(
    listing__owner=user
).aggregate(
    total_revenue=Sum('total_price'),
    total_bookings=Count('id'),
    avg_price=Avg('total_price')
)
```

---

## Date Filtering

### Recent Bookings (Last 30 Days)
```python
from django.utils import timezone
from datetime import timedelta

recent = Booking.objects.filter(
    created_at__gte=timezone.now() - timedelta(days=30)
)
```

### Bookings in Date Range
```python
from datetime import datetime

start = datetime(2025, 1, 1)
end = datetime(2025, 12, 31)

bookings = Booking.objects.filter(
    start_date__gte=start,
    end_date__lte=end
)
```

### Upcoming Bookings
```python
from django.utils import timezone

upcoming = Booking.objects.filter(
    start_date__gte=timezone.now()
)
```

---

## Status Filtering

### Booking Status
```python
# Draft
draft = Booking.objects.filter(status='draft')

# Pending confirmation
pending = Booking.objects.filter(status='pending')

# Confirmed
confirmed = Booking.objects.filter(status='confirmed')

# In progress
in_progress = Booking.objects.filter(status='in_progress')

# Completed
completed = Booking.objects.filter(status='completed')

# Cancelled
cancelled = Booking.objects.filter(status='cancelled')
```

### Listing Status
```python
# Draft
draft = Listing.objects.filter(status='draft')

# Active
active = Listing.objects.filter(status='active')

# Paused
paused = Listing.objects.filter(status='paused')

# Sold/Completed
sold = Listing.objects.filter(status='sold')
```

---

## Payment Status Filtering

```python
# Unpaid
unpaid = Booking.objects.filter(payment_status='unpaid')

# Partially paid
partial = Booking.objects.filter(payment_status='partial')

# Paid in full
paid = Booking.objects.filter(payment_status='paid')

# Refunded
refunded = Booking.objects.filter(payment_status='refunded')
```

---

## Ordering

### By Date (Most Recent First)
```python
listings = Listing.objects.all().order_by('-created_at')
bookings = Booking.objects.all().order_by('-created_at')
```

### By Price (Lowest First)
```python
listings = Listing.objects.all().order_by('price')
```

### By Price (Highest First)
```python
listings = Listing.objects.all().order_by('-price')
```

### By Views (Most Popular)
```python
listings = Listing.objects.all().order_by('-views')
```

---

## Pagination

```python
from django.core.paginator import Paginator

listings = Listing.objects.all()
paginator = Paginator(listings, 10)  # 10 items per page

page_number = request.GET.get('page')
page_obj = paginator.get_page(page_number)

# Access items
for item in page_obj:
    print(item)
```

---

## Select/Prefetch Related

### Select Related (OneToOne, ForeignKey)
```python
# Avoid N+1 queries
bookings = Booking.objects.select_related(
    'user',
    'listing',
    'booking_type'
).all()
```

### Prefetch Related (OneToMany, ManyToMany)
```python
# Avoid N+1 queries
listings = Listing.objects.prefetch_related(
    'images',
    'bookings'
).all()
```

### Combined
```python
bookings = Booking.objects.select_related(
    'user',
    'listing__owner',
    'booking_type'
).prefetch_related(
    'listing__images'
).all()
```

---

## Transactions

### Atomic Operations
```python
from django.db import transaction

@transaction.atomic
def create_booking_and_update_listing(booking_data, listing):
    booking = Booking.objects.create(**booking_data)
    listing.views += 1
    listing.save()
    return booking
```

---

## Signals & Hooks

### Post Save Signal
```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Booking)
def on_booking_created(sender, instance, created, **kwargs):
    if created:
        # Do something when booking is created
        pass
```

---

## Common Mistakes to Avoid

### ❌ WRONG: Using real_estate.Listing for seller queries
```python
from real_estate.models import Listing as REListing
listings = REListing.objects.filter(owner=user)  # No owner field!
```

### ✅ CORRECT: Using listings.Listing
```python
from listings.models import Listing
listings = Listing.objects.filter(owner=user)
```

### ❌ WRONG: N+1 queries
```python
bookings = Booking.objects.all()
for booking in bookings:
    print(booking.user.username)  # Query per booking!
```

### ✅ CORRECT: Select related
```python
bookings = Booking.objects.select_related('user').all()
for booking in bookings:
    print(booking.user.username)  # No extra queries
```

### ❌ WRONG: Querying in loop
```python
for user in users:
    bookings = Booking.objects.filter(user=user)  # N queries!
```

### ✅ CORRECT: Batch query
```python
bookings = Booking.objects.filter(user__in=users)  # 1 query
```

---

## Useful Admin Commands

```bash
# Check for issues
python manage.py check

# Run migrations
python manage.py migrate

# Create migration
python manage.py makemigrations

# Shell access
python manage.py shell

# Run tests
python manage.py test

# Create superuser
python manage.py createsuperuser
```

---

## Related Documentation

- `COMPLETE_DJANGO_APPS_MAP.md` - Comprehensive relationship map
- `DJANGO_APPS_RELATIONSHIP_MAP.md` - Detailed relationships
- `AGENTS.md` - Code style guidelines
- `API_CONTRACTS.md` - API standards

---

**Last Updated**: November 12, 2025  
**Status**: Complete - Ready for Development
