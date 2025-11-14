"""
Real Estate Models - v1 Comprehensive Data Model

Unified schema covering:
- Properties (physical units)
- Listings (market offerings: daily rental, long-term rental, sale, project)
- Projects (new developments)
- People (leads, clients, owners, tenants, agents)
- Features, amenities, utilities, taxes
- Deals, tenancies, and performance analytics

Design principles:
- Single properties table + single listings table with listing_type dimension
- Extension tables for type-specific fields (rental vs sale vs project)
- Contact + roles model for flexible people relationships
- Clean foreign keys for ownership, tenancy, and performance tracking
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


# ============================================================================
# 1. CORE REFERENCE TABLES
# ============================================================================

class Location(models.Model):
    """Geographic location for properties and projects."""

    id = models.BigAutoField(primary_key=True)
    country = models.CharField(max_length=64, default="Cyprus")
    region = models.CharField(max_length=64, help_text="e.g., 'North Cyprus'")
    city = models.CharField(max_length=64, help_text="e.g., 'Kyrenia'")
    area = models.CharField(max_length=128, help_text="e.g., 'Esentepe'")
    address_line = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["city", "area"]),
        ]
        verbose_name = "Location"
        verbose_name_plural = "Locations"

    def __str__(self):
        return f"{self.city}, {self.area}" if self.area else self.city


class PropertyType(models.Model):
    """Types of properties (apartment, villa, penthouse, etc.)."""

    CATEGORY_CHOICES = [
        ("RESIDENTIAL", "Residential"),
        ("COMMERCIAL", "Commercial"),
        ("LAND", "Land"),
    ]

    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True, help_text="e.g., 'APARTMENT', 'VILLA_TRIPLEX'")
    label = models.CharField(max_length=100, help_text="Human readable name")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="RESIDENTIAL")

    class Meta:
        verbose_name = "Property Type"
        verbose_name_plural = "Property Types"

    def __str__(self):
        return self.label


class FeatureCategory(models.Model):
    """Categories for property features (inside, outside, view, amenity)."""

    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True, help_text="e.g., 'INSIDE', 'OUTSIDE', 'VIEW', 'AMENITY'")
    label = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Feature Category"
        verbose_name_plural = "Feature Categories"

    def __str__(self):
        return self.label


class Feature(models.Model):
    """Property features and amenities (balcony, pool, WiFi, etc.)."""

    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=100, unique=True, help_text="e.g., 'BALCONY', 'WIFI', 'PRIVATE_POOL'")
    label = models.CharField(max_length=150)
    category = models.ForeignKey(FeatureCategory, on_delete=models.PROTECT, related_name="features")
    is_required_for_daily_rental = models.BooleanField(default=False, help_text="Required for short-term rentals")

    class Meta:
        indexes = [models.Index(fields=["category"])]
        verbose_name = "Feature"
        verbose_name_plural = "Features"

    def __str__(self):
        return self.label


class TitleDeedType(models.Model):
    """Title deed types (Turkish, Exchange, etc.)."""

    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True, help_text="e.g., 'TURKISH', 'EXCHANGE'")
    label = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Title Deed Type"
        verbose_name_plural = "Title Deed Types"

    def __str__(self):
        return self.label


class UtilityType(models.Model):
    """Utility types (electricity, water, internet, etc.)."""

    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True, help_text="e.g., 'ELECTRICITY', 'WATER', 'INTERNET'")
    label = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Utility Type"
        verbose_name_plural = "Utility Types"

    def __str__(self):
        return self.label


class TaxType(models.Model):
    """Tax types (electricity tax, water tax, property tax, etc.)."""

    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True, help_text="e.g., 'ELECTRICITY_TAX', 'PROPERTY_TAX'")
    label = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Tax Type"
        verbose_name_plural = "Tax Types"

    def __str__(self):
        return self.label


# ============================================================================
# 2. PEOPLE / CRM: LEADS, CLIENTS, OWNERS, TENANTS
# ============================================================================

class Contact(models.Model):
    """Base contact information for all people in the system."""

    id = models.BigAutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["phone"]),
            models.Index(fields=["email"]),
        ]
        verbose_name = "Contact"
        verbose_name_plural = "Contacts"

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()


class ContactRole(models.Model):
    """Roles a contact can have (lead, client, owner, tenant, agent)."""

    ROLE_CHOICES = [
        ("LEAD", "Lead"),
        ("CLIENT", "Client"),
        ("OWNER", "Owner"),
        ("TENANT", "Tenant"),
        ("AGENT", "Agent"),
    ]

    id = models.BigAutoField(primary_key=True)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name="roles")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    active_from = models.DateField(default=timezone.now)
    active_to = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ("contact", "role")
        verbose_name = "Contact Role"
        verbose_name_plural = "Contact Roles"

    def __str__(self):
        return f"{self.contact} - {self.get_role_display()}"


class Lead(models.Model):
    """Lead in the sales pipeline."""

    STATUS_CHOICES = [
        ("NEW", "New"),
        ("CONTACTED", "Contacted"),
        ("QUALIFIED", "Qualified"),
        ("LOST", "Lost"),
        ("CONVERTED", "Converted"),
    ]

    id = models.BigAutoField(primary_key=True)
    contact = models.OneToOneField(Contact, on_delete=models.CASCADE, related_name="lead")
    source = models.CharField(max_length=50, blank=True, help_text="portal, walk-in, instagram, etc.")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="NEW")
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_leads"
    )

    class Meta:
        verbose_name = "Lead"
        verbose_name_plural = "Leads"

    def __str__(self):
        return f"Lead: {self.contact} ({self.get_status_display()})"


class Client(models.Model):
    """Client (converted from lead or direct)."""

    id = models.BigAutoField(primary_key=True)
    contact = models.OneToOneField(Contact, on_delete=models.CASCADE, related_name="client")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"

    def __str__(self):
        return f"Client: {self.contact}"


# ============================================================================
# 3. PROJECTS (NEW DEVELOPMENTS)
# ============================================================================

class Project(models.Model):
    """Off-plan development project."""

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    developer = models.ForeignKey(
        Contact,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="developed_projects"
    )
    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="projects")

    total_units = models.IntegerField(null=True, blank=True)
    completion_date_estimate = models.DateField(null=True, blank=True)
    min_unit_area_sqm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    max_unit_area_sqm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    min_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    max_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="EUR")

    payment_plan_json = models.JSONField(default=dict, blank=True, help_text="Flexible payment plans")

    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Project"
        verbose_name_plural = "Projects"

    def __str__(self):
        return self.name


# ============================================================================
# 4. PROPERTY (PHYSICAL UNIT)
# ============================================================================

class Property(models.Model):
    """Physical property unit."""

    FURNISHED_CHOICES = [
        ("UNFURNISHED", "Unfurnished"),
        ("PARTLY_FURNISHED", "Partly Furnished"),
        ("FULLY_FURNISHED", "Fully Furnished"),
    ]

    id = models.BigAutoField(primary_key=True)
    reference_code = models.CharField(max_length=50, unique=True, help_text="e.g., 'EI-RE-000123'")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="properties")
    property_type = models.ForeignKey(PropertyType, on_delete=models.PROTECT, related_name="properties")

    building_name = models.CharField(max_length=255, blank=True)
    flat_number = models.CharField(max_length=50, blank=True)
    floor_number = models.IntegerField(null=True, blank=True)

    total_area_sqm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    net_area_sqm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    bedrooms = models.IntegerField(default=0)
    living_rooms = models.IntegerField(default=1)
    bathrooms = models.IntegerField(default=1)
    room_configuration_label = models.CharField(max_length=20, blank=True, help_text="e.g., '2+1'")

    furnished_status = models.CharField(max_length=20, choices=FURNISHED_CHOICES, default="UNFURNISHED")

    floor_of_building = models.IntegerField(null=True, blank=True)
    total_floors = models.IntegerField(null=True, blank=True)

    year_built = models.IntegerField(null=True, blank=True, help_text="Year built (for property age calculation)")
    is_gated_community = models.BooleanField(default=False)

    title_deed_type = models.ForeignKey(TitleDeedType, null=True, blank=True, on_delete=models.SET_NULL)

    # Link to project if this is a unit in a development
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.SET_NULL, related_name="units")

    features = models.ManyToManyField(Feature, through="PropertyFeature", related_name="properties")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["location", "property_type"]),
            models.Index(fields=["reference_code"]),
        ]
        verbose_name = "Property"
        verbose_name_plural = "Properties"

    def __str__(self):
        return f"{self.reference_code}: {self.title}"


class PropertyFeature(models.Model):
    """Link table between properties and features."""

    id = models.BigAutoField(primary_key=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    feature = models.ForeignKey(Feature, on_delete=models.PROTECT)

    class Meta:
        unique_together = ("property", "feature")
        verbose_name = "Property Feature"
        verbose_name_plural = "Property Features"

    def __str__(self):
        return f"{self.property.reference_code} - {self.feature.label}"


class PropertyOwner(models.Model):
    """Property ownership relationship."""

    id = models.BigAutoField(primary_key=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="owners")
    contact = models.ForeignKey(Contact, on_delete=models.PROTECT, related_name="owned_properties")
    ownership_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    is_primary = models.BooleanField(default=True)

    class Meta:
        unique_together = ("property", "contact")
        verbose_name = "Property Owner"
        verbose_name_plural = "Property Owners"

    def __str__(self):
        return f"{self.contact} owns {self.ownership_percentage}% of {self.property.reference_code}"


class PropertyUtilityAccount(models.Model):
    """Utility account information for a property."""

    id = models.BigAutoField(primary_key=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="utility_accounts")
    utility_type = models.ForeignKey(UtilityType, on_delete=models.PROTECT)
    provider_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=100, blank=True)
    meter_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("property", "utility_type")
        verbose_name = "Property Utility Account"
        verbose_name_plural = "Property Utility Accounts"

    def __str__(self):
        return f"{self.property.reference_code} - {self.utility_type.label}"


class PropertyTax(models.Model):
    """Tax information for a property."""

    id = models.BigAutoField(primary_key=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="taxes")
    tax_type = models.ForeignKey(TaxType, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="EUR")
    billing_period = models.CharField(max_length=20, blank=True, help_text="monthly, yearly, etc.")

    class Meta:
        unique_together = ("property", "tax_type")
        verbose_name = "Property Tax"
        verbose_name_plural = "Property Taxes"

    def __str__(self):
        return f"{self.property.reference_code} - {self.tax_type.label}"


# ============================================================================
# 5. LISTINGS (MARKET OFFERINGS)
# ============================================================================

class ListingType(models.Model):
    """Listing type dimension (daily rental, long-term rental, sale, project)."""

    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True, help_text="e.g., 'DAILY_RENTAL', 'SALE'")
    label = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Listing Type"
        verbose_name_plural = "Listing Types"

    def __str__(self):
        return self.label


class Listing(models.Model):
    """Market listing (can be rental, sale, or project)."""

    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
        ("UNDER_OFFER", "Under Offer"),
        ("SOLD", "Sold"),
        ("RENTED", "Rented"),
    ]

    PRICE_PERIOD_CHOICES = [
        ("PER_DAY", "Per day"),
        ("PER_MONTH", "Per month"),
        ("TOTAL", "Total"),
        ("STARTING_FROM", "Starting from"),
    ]

    id = models.BigAutoField(primary_key=True)
    reference_code = models.CharField(max_length=50, unique=True, help_text="e.g., 'EI-L-000123'")

    listing_type = models.ForeignKey(ListingType, on_delete=models.PROTECT, related_name="listings")
    property = models.ForeignKey(
        Property,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="listings"
    )
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="listings"
    )

    owner = models.ForeignKey(
        Contact,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="owner_listings",
        help_text="Main landlord/seller"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="EUR")

    price_period = models.CharField(max_length=20, choices=PRICE_PERIOD_CHOICES, default="TOTAL")

    available_from = models.DateField(null=True, blank=True)
    available_to = models.DateField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_listings"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["listing_type", "status"]),
            models.Index(fields=["property"]),
            models.Index(fields=["project"]),
            models.Index(fields=["reference_code"]),
        ]
        verbose_name = "Listing"
        verbose_name_plural = "Listings"

    def __str__(self):
        return f"{self.reference_code}: {self.title}"


class RentalDetails(models.Model):
    """Rental-specific details (daily + long term)."""

    RENTAL_KIND_CHOICES = [
        ("DAILY", "Daily / Short Term"),
        ("LONG_TERM", "Long Term"),
    ]

    id = models.BigAutoField(primary_key=True)
    listing = models.OneToOneField(Listing, on_delete=models.CASCADE, related_name="rental_details")

    rental_kind = models.CharField(max_length=20, choices=RENTAL_KIND_CHOICES)

    min_days = models.IntegerField(null=True, blank=True, help_text="For daily rentals")
    min_months = models.IntegerField(null=True, blank=True, help_text="For long term")

    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    deposit_currency = models.CharField(max_length=10, default="EUR")

    utilities_included = models.JSONField(default=dict, blank=True, help_text="e.g., {'ELECTRICITY': false, 'WATER': true}")

    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Rental Details"
        verbose_name_plural = "Rental Details"

    def __str__(self):
        return f"{self.listing.reference_code} - {self.get_rental_kind_display()}"


class SaleDetails(models.Model):
    """Sale-specific details."""

    id = models.BigAutoField(primary_key=True)
    listing = models.OneToOneField(Listing, on_delete=models.CASCADE, related_name="sale_details")

    is_swap_possible = models.BooleanField(default=False, help_text="Swap type deals")
    negotiable = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Sale Details"
        verbose_name_plural = "Sale Details"

    def __str__(self):
        return f"{self.listing.reference_code} - Sale"


class ProjectListingDetails(models.Model):
    """Project listing-specific details."""

    id = models.BigAutoField(primary_key=True)
    listing = models.OneToOneField(Listing, on_delete=models.CASCADE, related_name="project_details")

    completion_date = models.DateField(null=True, blank=True)
    min_unit_area_sqm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    max_unit_area_sqm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    payment_plan_json = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Project Listing Details"
        verbose_name_plural = "Project Listing Details"

    def __str__(self):
        return f"{self.listing.reference_code} - Project"


# ============================================================================
# 6. TENANCIES AND BOOKINGS
# ============================================================================

class Tenancy(models.Model):
    """Tenancy/booking record."""

    TENANCY_KIND_CHOICES = [
        ("DAILY", "Daily / Short Term"),
        ("LONG_TERM", "Long Term"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("ACTIVE", "Active"),
        ("ENDED", "Ended"),
        ("CANCELLED", "Cancelled"),
    ]

    id = models.BigAutoField(primary_key=True)
    property = models.ForeignKey(Property, on_delete=models.PROTECT, related_name="tenancies")
    listing = models.ForeignKey(Listing, null=True, blank=True, on_delete=models.SET_NULL, related_name="tenancies")

    tenant = models.ForeignKey(Contact, on_delete=models.PROTECT, related_name="tenancies")

    tenancy_kind = models.CharField(max_length=20, choices=TENANCY_KIND_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()

    rent_amount = models.DecimalField(max_digits=12, decimal_places=2)
    rent_currency = models.CharField(max_length=10, default="EUR")
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tenancy"
        verbose_name_plural = "Tenancies"

    def __str__(self):
        return f"{self.property.reference_code} - {self.tenant} ({self.start_date} to {self.end_date})"


# ============================================================================
# 7. DEALS / PIPELINE
# ============================================================================

class Deal(models.Model):
    """Deal tracking for sales pipeline."""

    DEAL_TYPE_CHOICES = [
        ("RENTAL", "Rental"),
        ("SALE", "Sale"),
        ("PROJECT_SALE", "Project Sale"),
    ]

    STAGE_CHOICES = [
        ("NEW", "New"),
        ("NEGOTIATION", "Negotiation"),
        ("RESERVATION", "Reservation"),
        ("CONTRACT_SIGNED", "Contract Signed"),
        ("CLOSED_WON", "Closed Won"),
        ("CLOSED_LOST", "Closed Lost"),
    ]

    id = models.BigAutoField(primary_key=True)
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name="deals")
    listing = models.ForeignKey(Listing, null=True, blank=True, on_delete=models.SET_NULL, related_name="deals")
    property = models.ForeignKey(Property, null=True, blank=True, on_delete=models.SET_NULL, related_name="deals")

    deal_type = models.CharField(max_length=20, choices=DEAL_TYPE_CHOICES)
    stage = models.CharField(max_length=30, choices=STAGE_CHOICES, default="NEW")

    expected_close_date = models.DateField(null=True, blank=True)
    actual_close_date = models.DateField(null=True, blank=True)

    agreed_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="EUR")
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Deal"
        verbose_name_plural = "Deals"

    def __str__(self):
        return f"Deal {self.id}: {self.client} - {self.get_stage_display()}"


# ============================================================================
# 8. PERFORMANCE & LOCATION ANALYTICS
# ============================================================================

class ListingEvent(models.Model):
    """Events on listings for analytics."""

    EVENT_TYPE_CHOICES = [
        ("VIEW", "View"),
        ("ENQUIRY", "Enquiry"),
        ("BOOKING_REQUEST", "Booking Request"),
        ("BOOKING_CONFIRMED", "Booking Confirmed"),
        ("WHATSAPP_CLICK", "WhatsApp Click"),
    ]

    id = models.BigAutoField(primary_key=True)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="events")
    occurred_at = models.DateTimeField(auto_now_add=True)
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES)

    source = models.CharField(max_length=50, blank=True, help_text="web, mobile, portal, etc.")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["listing", "event_type"]),
            models.Index(fields=["occurred_at"]),
        ]
        verbose_name = "Listing Event"
        verbose_name_plural = "Listing Events"

    def __str__(self):
        return f"{self.listing.reference_code} - {self.get_event_type_display()} at {self.occurred_at}"
