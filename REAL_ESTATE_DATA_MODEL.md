# Real Estate Data Model Documentation

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Core Reference Tables](#core-reference-tables)
5. [People & CRM Models](#people--crm-models)
6. [Property Models](#property-models)
7. [Listing Models](#listing-models)
8. [Tenancy & Deal Models](#tenancy--deal-models)
9. [Analytics Models](#analytics-models)
10. [Common Queries](#common-queries)
11. [Validation Rules](#validation-rules)
12. [Migration & Seeding](#migration--seeding)

---

## Overview

This document describes the **v1 Real Estate Data Model** for the Easy Islanders platform. The model is designed to support:

- **Properties**: Physical real estate units (apartments, villas, etc.)
- **Listings**: Market offerings (daily rentals, long-term rentals, sales, projects)
- **Projects**: Off-plan developments
- **People**: Leads, clients, owners, tenants, and agents
- **Features**: Amenities, utilities, taxes, title deeds
- **Deals**: Sales pipeline and transaction tracking
- **Tenancies**: Rental agreements and bookings
- **Analytics**: Performance tracking by location and listing type

### Key Benefits

- **Unified Schema**: One properties table, one listings table with a `listing_type` dimension
- **Type-Specific Extensions**: Separate tables for rental/sale/project-specific fields
- **Flexible CRM**: Contact + roles model allows the same person to be a lead, client, owner, or tenant
- **Clean Relationships**: Always know who owns what, who's renting what, and where
- **Analytics-Ready**: Track views, enquiries, bookings by location and listing type

---

## Design Principles

### 1. Single Source of Truth

Instead of four separate databases (rental, sales, project, daily rental), we use:

- **One `Property` table** for all physical units
- **One `Listing` table** with a `listing_type` dimension:
  - `DAILY_RENTAL`
  - `LONG_TERM_RENTAL`
  - `SALE`
  - `PROJECT`

### 2. Extension Tables for Type-Specific Data

To avoid a giant table with many nullable fields, we use extension tables:

- `RentalDetails` for daily and long-term rentals
- `SaleDetails` for sales
- `ProjectListingDetails` for off-plan projects

Each extension table has a `OneToOneField` to `Listing`.

### 3. Contact + Roles Model

A single `Contact` record can have multiple roles over time:

- **Lead** → potential customer
- **Client** → converted customer
- **Owner** → property owner
- **Tenant** → current renter
- **Agent** → real estate agent

The `ContactRole` table tracks role assignments with `active_from` and `active_to` dates.

### 4. Analytics by Location

All queries can be segmented by:

- Country, region, city, area (via `Location`)
- Listing type (daily rental, long-term, sale, project)
- Property type (apartment, villa, etc.)

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Location   │◄────────┤  Property   │────────►│PropertyType │
└─────────────┘         └─────────────┘         └─────────────┘
                              │                         │
                              │                         │
                              │                  ┌──────┴──────┐
                              │                  │             │
                        ┌─────┴─────┐      ┌────▼────┐  ┌─────▼─────┐
                        │  Listing  │      │ Feature │  │TitleDeed  │
                        └─────┬─────┘      └─────────┘  └───────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼─────┐ ┌────▼─────┐ ┌────▼──────┐
         │RentalDetails│ │SaleDetails│ │ProjectDetails│
         └────────────┘ └───────────┘ └────────────┘

┌─────────────┐         ┌─────────────┐
│   Contact   │────────►│ContactRole  │
└─────┬───────┘         └─────────────┘
      │
      ├─────►┌─────────┐
      │      │  Lead   │
      │      └─────────┘
      │
      ├─────►┌─────────┐
      │      │ Client  │
      │      └─────────┘
      │
      ├─────►┌──────────────┐
      │      │PropertyOwner │
      │      └──────────────┘
      │
      └─────►┌─────────┐
             │ Tenancy │
             └─────────┘
```

---

## Core Reference Tables

### 1. Location

**Purpose**: Geographic hierarchy for properties and projects.

| Field         | Type            | Description                |
|---------------|-----------------|----------------------------|
| `id`          | BigAutoField    | Primary key                |
| `country`     | CharField(64)   | Default: "Cyprus"          |
| `region`      | CharField(64)   | e.g., "North Cyprus"       |
| `city`        | CharField(64)   | e.g., "Kyrenia"            |
| `area`        | CharField(128)  | e.g., "Esentepe"           |
| `address_line`| CharField(255)  | Full address (optional)    |
| `latitude`    | Decimal(9,6)    | GPS latitude               |
| `longitude`   | Decimal(9,6)    | GPS longitude              |

**Indexes**: `(city, area)`

**Example**:
```python
location = Location.objects.create(
    country="Cyprus",
    region="North Cyprus",
    city="Kyrenia",
    area="Esentepe"
)
```

---

### 2. PropertyType

**Purpose**: Categorize properties (apartment, villa, penthouse, etc.).

| Field      | Type            | Description                    |
|------------|-----------------|--------------------------------|
| `id`       | BigAutoField    | Primary key                    |
| `code`     | CharField(50)   | Unique code (e.g., "APARTMENT")|
| `label`    | CharField(100)  | Human-readable name            |
| `category` | CharField(50)   | RESIDENTIAL, COMMERCIAL, LAND  |

**Seeded Values**:
- Residential: Apartment, Penthouse, Villa (Detached/Semi-Detached), Bungalow, Duplex, Triplex, Studio, Townhouse
- Commercial: Office, Retail, Warehouse, Hotel
- Land: Residential Land, Commercial Land, Agricultural Land

---

### 3. FeatureCategory & Feature

**Purpose**: Categorize property features (inside, outside, view, amenity).

#### FeatureCategory

| Field   | Type            | Description                |
|---------|-----------------|----------------------------|
| `id`    | BigAutoField    | Primary key                |
| `code`  | CharField(50)   | e.g., "INSIDE", "OUTSIDE"  |
| `label` | CharField(100)  | e.g., "Inside Features"    |

#### Feature

| Field                        | Type            | Description                    |
|------------------------------|-----------------|--------------------------------|
| `id`                         | BigAutoField    | Primary key                    |
| `code`                       | CharField(100)  | e.g., "BALCONY", "WIFI"        |
| `label`                      | CharField(150)  | e.g., "Balcony", "Wi-Fi"       |
| `category`                   | ForeignKey      | → FeatureCategory              |
| `is_required_for_daily_rental` | BooleanField  | True for WIFI and KITCHEN      |

**Seeded Features**:

- **Inside**: Balcony, Master Cabinet, Fire Alarm, Master Bedroom, WC, Laundry Room, Intercom, Wallpaper, Fireplace, Natural Marble, Air Conditioning, TV Infrastructure, Water Tank, Kitchen*, Storage Room, En-suite Bathroom, Walk-in Closet, Hardwood Floors, Ceiling Fan
- **Outside**: Closed Parking, Elevator, Garage, Terrace, BBQ, Public Pool, Garden, Shared Pool, Bounding Wall, Private Pool, Security Camera, Generator, Car Park, Automated Parking, Water Well, Yellow Stone House, Playground, Gym, Sauna, Tennis Court, Basketball Court
- **View**: Sea View, Mountain View, City View, Garden View, Pool View
- **Amenity**: Wi-Fi*, Fully Equipped Kitchen, Washing Machine, Dryer, Dishwasher, Microwave, Coffee Machine, Satellite TV, Smart TV, Netflix, Parking Space, Wheelchair Accessible, Pet Friendly, Concierge, 24/7 Security

\* = Required for daily rentals (`is_required_for_daily_rental=True`)

---

### 4. TitleDeedType

**Purpose**: Types of property title deeds in North Cyprus.

| Field   | Type            | Description                |
|---------|-----------------|----------------------------|
| `id`    | BigAutoField    | Primary key                |
| `code`  | CharField(50)   | e.g., "TURKISH", "EXCHANGE"|
| `label` | CharField(100)  | e.g., "Turkish Title Deed" |

**Seeded Values**: Turkish, Exchange, Koçan, TRNC, British

---

### 5. UtilityType

**Purpose**: Types of utilities (electricity, water, internet, etc.).

| Field   | Type            | Description                |
|---------|-----------------|----------------------------|
| `id`    | BigAutoField    | Primary key                |
| `code`  | CharField(50)   | e.g., "ELECTRICITY"        |
| `label` | CharField(100)  | e.g., "Electricity"        |

**Seeded Values**: Electricity, Water, Internet, Gas, Sewage, Garbage Collection

---

### 6. TaxType

**Purpose**: Types of taxes applicable to properties.

| Field   | Type            | Description                |
|---------|-----------------|----------------------------|
| `id`    | BigAutoField    | Primary key                |
| `code`  | CharField(50)   | e.g., "PROPERTY_TAX"       |
| `label` | CharField(100)  | e.g., "Property Tax"       |

**Seeded Values**: Electricity Tax, Water Tax, Property Tax, Municipal Tax, Council Tax, VAT

---

## People & CRM Models

### 1. Contact

**Purpose**: Base record for all people in the system.

| Field         | Type            | Description                |
|---------------|-----------------|----------------------------|
| `id`          | BigAutoField    | Primary key                |
| `first_name`  | CharField(100)  | First name                 |
| `last_name`   | CharField(100)  | Last name (optional)       |
| `phone`       | CharField(50)   | Phone number               |
| `email`       | EmailField      | Email address              |
| `nationality` | CharField(100)  | Nationality                |
| `notes`       | TextField       | Additional notes           |

**Indexes**: `(phone)`, `(email)`

---

### 2. ContactRole

**Purpose**: Track roles a contact can have over time.

| Field         | Type            | Description                |
|---------------|-----------------|----------------------------|
| `id`          | BigAutoField    | Primary key                |
| `contact`     | ForeignKey      | → Contact                  |
| `role`        | CharField(20)   | LEAD, CLIENT, OWNER, TENANT, AGENT |
| `active_from` | DateField       | Role start date            |
| `active_to`   | DateField       | Role end date (nullable)   |

**Unique Constraint**: `(contact, role)`

---

### 3. Lead

**Purpose**: Potential customer in the sales pipeline.

| Field           | Type            | Description                |
|-----------------|-----------------|----------------------------|
| `id`            | BigAutoField    | Primary key                |
| `contact`       | OneToOneField   | → Contact                  |
| `source`        | CharField(50)   | portal, walk-in, instagram |
| `status`        | CharField(30)   | NEW, CONTACTED, QUALIFIED, LOST, CONVERTED |
| `created_at`    | DateTimeField   | Created timestamp          |
| `assigned_agent`| ForeignKey      | → User (nullable)          |

---

### 4. Client

**Purpose**: Converted customer (from lead or direct).

| Field        | Type            | Description                |
|--------------|-----------------|----------------------------|
| `id`         | BigAutoField    | Primary key                |
| `contact`    | OneToOneField   | → Contact                  |
| `created_at` | DateTimeField   | Created timestamp          |

**Workflow**:
1. Contact becomes a Lead
2. Lead status → CONVERTED
3. Create Client record for same Contact
4. Add `ContactRole(role="CLIENT")`

---

## Property Models

### 1. Property

**Purpose**: Physical real estate unit.

| Field                      | Type            | Description                |
|----------------------------|-----------------|----------------------------|
| `id`                       | BigAutoField    | Primary key                |
| `reference_code`           | CharField(50)   | Unique ref (e.g., "EI-RE-000123") |
| `title`                    | CharField(255)  | Property title             |
| `description`              | TextField       | Full description           |
| `location`                 | ForeignKey      | → Location                 |
| `property_type`            | ForeignKey      | → PropertyType             |
| `building_name`            | CharField(255)  | Building name (optional)   |
| `flat_number`              | CharField(50)   | Flat/unit number           |
| `floor_number`             | IntegerField    | Floor number               |
| `total_area_sqm`           | Decimal(8,2)    | Total area (sqm)           |
| `net_area_sqm`             | Decimal(8,2)    | Net area (sqm)             |
| `bedrooms`                 | IntegerField    | Number of bedrooms         |
| `living_rooms`             | IntegerField    | Number of living rooms     |
| `bathrooms`                | IntegerField    | Number of bathrooms        |
| `room_configuration_label` | CharField(20)   | e.g., "2+1"                |
| `furnished_status`         | CharField(20)   | UNFURNISHED, PARTLY_FURNISHED, FULLY_FURNISHED |
| `floor_of_building`        | IntegerField    | Floor of building          |
| `total_floors`             | IntegerField    | Total floors in building   |
| `year_built`               | IntegerField    | Year built (for age calc)  |
| `is_gated_community`       | BooleanField    | Gated community flag       |
| `title_deed_type`          | ForeignKey      | → TitleDeedType (nullable) |
| `project`                  | ForeignKey      | → Project (nullable)       |
| `features`                 | ManyToManyField | → Feature (through PropertyFeature) |
| `created_at`               | DateTimeField   | Created timestamp          |
| `updated_at`               | DateTimeField   | Updated timestamp          |

**Indexes**: `(location, property_type)`, `(reference_code)`

---

### 2. PropertyFeature

**Purpose**: Link table between Property and Feature.

| Field      | Type        | Description    |
|------------|-------------|----------------|
| `id`       | BigAutoField| Primary key    |
| `property` | ForeignKey  | → Property     |
| `feature`  | ForeignKey  | → Feature      |

**Unique Constraint**: `(property, feature)`

---

### 3. PropertyOwner

**Purpose**: Property ownership relationship (supports co-ownership).

| Field                  | Type           | Description              |
|------------------------|----------------|--------------------------|
| `id`                   | BigAutoField   | Primary key              |
| `property`             | ForeignKey     | → Property               |
| `contact`              | ForeignKey     | → Contact                |
| `ownership_percentage` | Decimal(5,2)   | Ownership % (default 100)|
| `is_primary`           | BooleanField   | Primary owner flag       |

**Unique Constraint**: `(property, contact)`

---

### 4. PropertyUtilityAccount

**Purpose**: Track utility accounts for a property.

| Field            | Type        | Description              |
|------------------|-------------|--------------------------|
| `id`             | BigAutoField| Primary key              |
| `property`       | ForeignKey  | → Property               |
| `utility_type`   | ForeignKey  | → UtilityType            |
| `provider_name`  | CharField   | Provider name            |
| `account_number` | CharField   | Account number           |
| `meter_number`   | CharField   | Meter number             |
| `notes`          | TextField   | Additional notes         |

**Unique Constraint**: `(property, utility_type)`

---

### 5. PropertyTax

**Purpose**: Tax information for a property.

| Field            | Type           | Description              |
|------------------|----------------|--------------------------|
| `id`             | BigAutoField   | Primary key              |
| `property`       | ForeignKey     | → Property               |
| `tax_type`       | ForeignKey     | → TaxType                |
| `amount`         | Decimal(10,2)  | Tax amount               |
| `currency`       | CharField(10)  | Currency (default EUR)   |
| `billing_period` | CharField(20)  | monthly, yearly, etc.    |

**Unique Constraint**: `(property, tax_type)`

---

### 6. Project

**Purpose**: Off-plan development project.

| Field                    | Type           | Description              |
|--------------------------|----------------|--------------------------|
| `id`                     | BigAutoField   | Primary key              |
| `name`                   | CharField(255) | Project name             |
| `developer`              | ForeignKey     | → Contact (nullable)     |
| `location`               | ForeignKey     | → Location               |
| `total_units`            | IntegerField   | Total units              |
| `completion_date_estimate` | DateField    | Estimated completion     |
| `min_unit_area_sqm`      | Decimal(8,2)   | Min unit area            |
| `max_unit_area_sqm`      | Decimal(8,2)   | Max unit area            |
| `min_price`              | Decimal(12,2)  | Min price                |
| `max_price`              | Decimal(12,2)  | Max price                |
| `currency`               | CharField(10)  | Currency (default EUR)   |
| `payment_plan_json`      | JSONField      | Payment plans            |
| `description`            | TextField      | Project description      |
| `created_at`             | DateTimeField  | Created timestamp        |

**Note**: Each unit in a project is a `Property` with `project` FK set.

---

## Listing Models

### 1. ListingType

**Purpose**: Dimension for listing types.

| Field   | Type            | Description                |
|---------|-----------------|----------------------------|
| `id`    | BigAutoField    | Primary key                |
| `code`  | CharField(50)   | e.g., "DAILY_RENTAL"       |
| `label` | CharField(100)  | e.g., "Daily Rental"       |

**Seeded Values**:
- `DAILY_RENTAL` → Daily Rental (Short-Term)
- `LONG_TERM_RENTAL` → Long-Term Rental
- `SALE` → For Sale
- `PROJECT` → Project (Off-Plan Development)

---

### 2. Listing

**Purpose**: Market listing (can be rental, sale, or project).

| Field           | Type           | Description              |
|-----------------|----------------|--------------------------|
| `id`            | BigAutoField   | Primary key              |
| `reference_code`| CharField(50)  | Unique ref (e.g., "EI-L-000123") |
| `listing_type`  | ForeignKey     | → ListingType            |
| `property`      | ForeignKey     | → Property (nullable)    |
| `project`       | ForeignKey     | → Project (nullable)     |
| `owner`         | ForeignKey     | → Contact (main landlord/seller) |
| `title`         | CharField(255) | Listing title            |
| `description`   | TextField      | Full description         |
| `base_price`    | Decimal(12,2)  | Base price               |
| `currency`      | CharField(10)  | Currency (default EUR)   |
| `price_period`  | CharField(20)  | PER_DAY, PER_MONTH, TOTAL, STARTING_FROM |
| `available_from`| DateField      | Available from date      |
| `available_to`  | DateField      | Available to date        |
| `is_active`     | BooleanField   | Active flag              |
| `status`        | CharField(20)  | DRAFT, ACTIVE, INACTIVE, UNDER_OFFER, SOLD, RENTED |
| `created_by`    | ForeignKey     | → User (nullable)        |
| `created_at`    | DateTimeField  | Created timestamp        |
| `updated_at`    | DateTimeField  | Updated timestamp        |

**Indexes**: `(listing_type, status)`, `(property)`, `(project)`, `(reference_code)`

---

### 3. RentalDetails

**Purpose**: Rental-specific details (daily + long-term).

| Field               | Type           | Description              |
|---------------------|----------------|--------------------------|
| `id`                | BigAutoField   | Primary key              |
| `listing`           | OneToOneField  | → Listing                |
| `rental_kind`       | CharField(20)  | DAILY, LONG_TERM         |
| `min_days`          | IntegerField   | Min days (daily rentals) |
| `min_months`        | IntegerField   | Min months (long-term)   |
| `deposit_amount`    | Decimal(12,2)  | Deposit amount           |
| `deposit_currency`  | CharField(10)  | Currency (default EUR)   |
| `utilities_included`| JSONField      | e.g., {"ELECTRICITY": false, "WATER": true} |
| `notes`             | TextField      | Additional notes         |

---

### 4. SaleDetails

**Purpose**: Sale-specific details.

| Field              | Type         | Description              |
|--------------------|--------------|--------------------------|
| `id`               | BigAutoField | Primary key              |
| `listing`          | OneToOneField| → Listing                |
| `is_swap_possible` | BooleanField | Swap deals flag          |
| `negotiable`       | BooleanField | Negotiable flag          |

---

### 5. ProjectListingDetails

**Purpose**: Project listing-specific details.

| Field                | Type           | Description              |
|----------------------|----------------|--------------------------|
| `id`                 | BigAutoField   | Primary key              |
| `listing`            | OneToOneField  | → Listing                |
| `completion_date`    | DateField      | Project completion date  |
| `min_unit_area_sqm`  | Decimal(8,2)   | Min unit area            |
| `max_unit_area_sqm`  | Decimal(8,2)   | Max unit area            |
| `payment_plan_json`  | JSONField      | Payment plans            |

---

## Tenancy & Deal Models

### 1. Tenancy

**Purpose**: Rental agreement / booking record.

| Field          | Type           | Description              |
|----------------|----------------|--------------------------|
| `id`           | BigAutoField   | Primary key              |
| `property`     | ForeignKey     | → Property               |
| `listing`      | ForeignKey     | → Listing (nullable)     |
| `tenant`       | ForeignKey     | → Contact                |
| `tenancy_kind` | CharField(20)  | DAILY, LONG_TERM         |
| `start_date`   | DateField      | Start date               |
| `end_date`     | DateField      | End date                 |
| `rent_amount`  | Decimal(12,2)  | Rent amount              |
| `rent_currency`| CharField(10)  | Currency (default EUR)   |
| `deposit_amount`| Decimal(12,2) | Deposit amount           |
| `status`       | CharField(20)  | PENDING, ACTIVE, ENDED, CANCELLED |
| `created_at`   | DateTimeField  | Created timestamp        |

---

### 2. Deal

**Purpose**: Deal tracking for sales pipeline.

| Field                | Type           | Description              |
|----------------------|----------------|--------------------------|
| `id`                 | BigAutoField   | Primary key              |
| `client`             | ForeignKey     | → Client                 |
| `listing`            | ForeignKey     | → Listing (nullable)     |
| `property`           | ForeignKey     | → Property (nullable)    |
| `deal_type`          | CharField(20)  | RENTAL, SALE, PROJECT_SALE |
| `stage`              | CharField(30)  | NEW, NEGOTIATION, RESERVATION, CONTRACT_SIGNED, CLOSED_WON, CLOSED_LOST |
| `expected_close_date`| DateField      | Expected close date      |
| `actual_close_date`  | DateField      | Actual close date        |
| `agreed_price`       | Decimal(12,2)  | Agreed price             |
| `currency`           | CharField(10)  | Currency (default EUR)   |
| `commission_amount`  | Decimal(12,2)  | Commission amount        |
| `created_at`         | DateTimeField  | Created timestamp        |

---

## Analytics Models

### 1. ListingEvent

**Purpose**: Track events on listings for analytics.

| Field        | Type           | Description              |
|--------------|----------------|--------------------------|
| `id`         | BigAutoField   | Primary key              |
| `listing`    | ForeignKey     | → Listing                |
| `occurred_at`| DateTimeField  | Event timestamp          |
| `event_type` | CharField(30)  | VIEW, ENQUIRY, BOOKING_REQUEST, BOOKING_CONFIRMED, WHATSAPP_CLICK |
| `source`     | CharField(50)  | web, mobile, portal, etc.|
| `metadata`   | JSONField      | Additional metadata      |

**Indexes**: `(listing, event_type)`, `(occurred_at)`

**Usage**:
```python
# Track a view
ListingEvent.objects.create(
    listing=listing,
    event_type="VIEW",
    source="web"
)

# Track an enquiry
ListingEvent.objects.create(
    listing=listing,
    event_type="ENQUIRY",
    source="mobile",
    metadata={"message": "Interested in viewing"}
)
```

---

## Common Queries

### 1. Top 10 Daily Rentals in Esentepe (Last Month)

```python
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count

one_month_ago = timezone.now() - timedelta(days=30)

top_daily_rentals = (
    Listing.objects
    .filter(
        listing_type__code="DAILY_RENTAL",
        property__location__city="Kyrenia",
        property__location__area="Esentepe",
        events__occurred_at__gte=one_month_ago
    )
    .annotate(view_count=Count('events'))
    .order_by('-view_count')[:10]
)
```

### 2. Properties with WiFi + Kitchen Available This Week

```python
from datetime import date, timedelta

today = date.today()
next_week = today + timedelta(days=7)

properties = (
    Property.objects
    .filter(
        features__code__in=["WIFI", "KITCHEN"],
        listings__listing_type__code="DAILY_RENTAL",
        listings__available_from__lte=today,
        listings__available_to__gte=next_week
    )
    .distinct()
)
```

### 3. Sales Listings in Kyrenia (Best Performing Last Quarter)

```python
from django.db.models import Count

three_months_ago = timezone.now() - timedelta(days=90)

top_sales = (
    Listing.objects
    .filter(
        listing_type__code="SALE",
        property__location__city="Kyrenia",
        events__occurred_at__gte=three_months_ago
    )
    .annotate(enquiry_count=Count('events', filter=Q(events__event_type='ENQUIRY')))
    .order_by('-enquiry_count')
)
```

### 4. Who Owns This Property?

```python
property = Property.objects.get(reference_code="EI-RE-000123")
owners = PropertyOwner.objects.filter(property=property)
for owner in owners:
    print(f"{owner.contact} owns {owner.ownership_percentage}%")
```

### 5. Current Tenant of a Property

```python
from django.db.models import Q

property = Property.objects.get(reference_code="EI-RE-000123")
current_tenancy = (
    Tenancy.objects
    .filter(
        property=property,
        status="ACTIVE",
        start_date__lte=date.today(),
        end_date__gte=date.today()
    )
    .first()
)

if current_tenancy:
    print(f"Current tenant: {current_tenancy.tenant}")
```

### 6. Conversion Funnel (Enquiry → Deal → Closed Won)

```python
from django.db.models import Count, Q

funnel = (
    Listing.objects
    .filter(listing_type__code="SALE")
    .annotate(
        enquiry_count=Count('events', filter=Q(events__event_type='ENQUIRY')),
        deal_count=Count('deals'),
        closed_won_count=Count('deals', filter=Q(deals__stage='CLOSED_WON'))
    )
)
```

---

## Validation Rules

### 1. Daily Rental Listings Must Have Required Features

**Rule**: A listing with `listing_type="DAILY_RENTAL"` must have properties with:
- WiFi (`is_required_for_daily_rental=True`)
- Kitchen (`is_required_for_daily_rental=True`)

**Implementation**: Add a `clean()` method or pre-save signal:

```python
from django.core.exceptions import ValidationError

def validate_daily_rental(listing):
    if listing.listing_type.code == "DAILY_RENTAL" and listing.property:
        required_features = Feature.objects.filter(is_required_for_daily_rental=True)
        property_features = listing.property.features.all()

        missing = required_features.exclude(id__in=property_features.values_list('id', flat=True))
        if missing.exists():
            raise ValidationError(
                f"Daily rental properties must have: {', '.join(missing.values_list('label', flat=True))}"
            )
```

### 2. No Overlapping Tenancies for Same Property

**Rule**: A property cannot have overlapping tenancies.

**Implementation**: Check on tenancy save:

```python
def validate_no_overlap(tenancy):
    overlapping = (
        Tenancy.objects
        .filter(
            property=tenancy.property,
            status__in=["PENDING", "ACTIVE"]
        )
        .exclude(id=tenancy.id)
        .filter(
            Q(start_date__lte=tenancy.end_date, end_date__gte=tenancy.start_date)
        )
    )

    if overlapping.exists():
        raise ValidationError("This property already has a tenancy for these dates")
```

### 3. Extension Tables Match Listing Type

**Rule**:
- If `listing_type="DAILY_RENTAL"` or `"LONG_TERM_RENTAL"`, must have `RentalDetails`
- If `listing_type="SALE"`, must have `SaleDetails`
- If `listing_type="PROJECT"`, must have `ProjectListingDetails`

---

## Migration & Seeding

### 1. Generate Migrations

After defining models, generate migrations:

```bash
python manage.py makemigrations real_estate
```

This will create a migration file like `0001_initial.py` with all model definitions.

### 2. Apply Migrations

```bash
python manage.py migrate real_estate
```

### 3. Seed Reference Data

```bash
python manage.py seed_real_estate_data
```

This command populates:
- 4 listing types
- 16 property types
- 4 feature categories
- 60+ features (including required daily rental features)
- 5 title deed types
- 6 utility types
- 6 tax types
- 13 sample locations in North Cyprus

**Clear and Re-seed**:
```bash
python manage.py seed_real_estate_data --clear
```

⚠️ **WARNING**: `--clear` will delete all reference data. Use with caution.

---

## Rollback Strategy

All changes are in the `real_estate` app migrations.

### Rollback to Previous Migration

```bash
python manage.py migrate real_estate <migration_name>
```

### Migration Structure (Example)

```
0001_initial_core     → Location, Contact, Property, Feature, etc.
0002_listings         → Listing, RentalDetails, SaleDetails, ProjectListingDetails
0003_projects         → Project
0004_tenancies_deals  → Tenancy, Deal, ListingEvent
```

This allows rolling back specific layers without nuking everything.

---

## Testing

### Unit Tests

Create tests in `real_estate/tests.py`:

```python
from django.test import TestCase
from real_estate.models import Property, PropertyType, Location, Feature

class PropertyModelTests(TestCase):
    def test_create_property_with_features(self):
        location = Location.objects.create(city="Kyrenia", area="Esentepe")
        prop_type = PropertyType.objects.create(code="APARTMENT", label="Apartment")

        property = Property.objects.create(
            reference_code="TEST-001",
            title="Test Apartment",
            location=location,
            property_type=prop_type,
            bedrooms=2,
            living_rooms=1,
            bathrooms=1,
            room_configuration_label="2+1"
        )

        wifi = Feature.objects.create(code="WIFI", label="Wi-Fi", is_required_for_daily_rental=True)
        property.features.add(wifi)

        self.assertEqual(property.features.count(), 1)
        self.assertTrue(property.features.filter(code="WIFI").exists())
```

### Run Tests

```bash
python manage.py test real_estate
```

---

## Monitoring & Metrics

### Key Metrics

- **Listing Count by Type + Status**
  ```python
  Listing.objects.values('listing_type__code', 'status').annotate(count=Count('id'))
  ```

- **Events per Day by Type**
  ```python
  ListingEvent.objects.filter(occurred_at__date=date.today()).values('event_type').annotate(count=Count('id'))
  ```

- **Properties Missing Required Fields**
  ```python
  Property.objects.filter(title_deed_type__isnull=True).count()
  ```

### Logging Warnings

- Creating a daily rental for a property without required features
- Creating overlapping tenancies
- Missing title deed type

---

## Future Enhancements

### v2 Features (Potential)

1. **Booking Calendar**: Full calendar integration for daily rentals
2. **Payment Processing**: Integrate with payment gateways
3. **Document Management**: Upload contracts, title deeds, invoices
4. **Tenant Portal**: Allow tenants to pay rent, submit maintenance requests
5. **Owner Portal**: Allow owners to view performance, earnings, bookings
6. **Multi-currency**: Support multiple currencies with exchange rates
7. **Advanced Search**: Full-text search with filters (Elasticsearch)
8. **API Versioning**: RESTful API with versioning
9. **Mobile App**: React Native app for agents and clients
10. **AI Recommendations**: ML-based property recommendations

---

## Support & Questions

For questions about the data model:

1. Check this documentation first
2. Review the model source code: `real_estate/models.py`
3. Check the seed command: `real_estate/management/commands/seed_real_estate_data.py`
4. Run the seed command to see sample data

**Last Updated**: 2025-11-14 (v1.0 - Initial Release)
