"""
Serializers for Real Estate Dashboard API endpoints.
"""
from rest_framework import serializers


class RealEstateOverviewSerializer(serializers.Serializer):
    """Overview dashboard data."""
    occupancy_rate = serializers.FloatField()
    monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    active_deals = serializers.IntegerField()
    new_requests = serializers.IntegerField()
    total_units = serializers.IntegerField()
    units_occupied = serializers.IntegerField()


class PropertyUnitSerializer(serializers.Serializer):
    """Individual property unit for portfolio."""
    id = serializers.UUIDField()
    title = serializers.CharField()
    property_type = serializers.CharField()
    bedrooms = serializers.IntegerField()
    bathrooms = serializers.FloatField()
    city = serializers.CharField()
    status = serializers.CharField()
    monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    occupancy_rate = serializers.FloatField()


class RealEstatePortfolioSerializer(serializers.Serializer):
    """Portfolio dashboard data."""
    units = PropertyUnitSerializer(many=True)
    total_units = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    unit_mix = serializers.DictField(child=serializers.IntegerField())


class LocationDataSerializer(serializers.Serializer):
    """Location-specific performance data."""
    city = serializers.CharField()
    district = serializers.CharField(allow_blank=True)
    property_count = serializers.IntegerField()
    avg_occupancy = serializers.FloatField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    latitude = serializers.FloatField(allow_null=True)
    longitude = serializers.FloatField(allow_null=True)


class RealEstateLocationSerializer(serializers.Serializer):
    """Location performance dashboard data."""
    areas = LocationDataSerializer(many=True)


class OccupancyDataPointSerializer(serializers.Serializer):
    """Time-series occupancy data point."""
    date = serializers.DateField()
    occupancy_rate = serializers.FloatField()
    units_occupied = serializers.IntegerField()
    units_vacant = serializers.IntegerField()


class RealEstateOccupancySerializer(serializers.Serializer):
    """Occupancy dashboard data."""
    series = OccupancyDataPointSerializer(many=True)
    current_occupancy_rate = serializers.FloatField()
    avg_occupancy_rate = serializers.FloatField()


class RevenueDataPointSerializer(serializers.Serializer):
    """Revenue data point."""
    month = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    net = serializers.DecimalField(max_digits=12, decimal_places=2)


class RealEstateEarningsSerializer(serializers.Serializer):
    """Earnings dashboard data."""
    revenue_series = RevenueDataPointSerializer(many=True)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_payouts = serializers.DecimalField(max_digits=12, decimal_places=2)


class PipelineStageSerializer(serializers.Serializer):
    """Sales pipeline stage."""
    stage = serializers.CharField()
    count = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=12, decimal_places=2)


class RealEstateSalesPipelineSerializer(serializers.Serializer):
    """Sales pipeline dashboard data."""
    stages = PipelineStageSerializer(many=True)
    total_deals = serializers.IntegerField()
    pipeline_value = serializers.DecimalField(max_digits=12, decimal_places=2)


class RequestItemSerializer(serializers.Serializer):
    """Individual request/inquiry."""
    id = serializers.UUIDField()
    requester_name = serializers.CharField()
    property_id = serializers.UUIDField(allow_null=True)
    property_title = serializers.CharField(allow_blank=True)
    message = serializers.CharField()
    created_at = serializers.DateTimeField()
    status = serializers.CharField()


class RealEstateRequestsSerializer(serializers.Serializer):
    """Requests dashboard data."""
    requests = RequestItemSerializer(many=True)
    total_requests = serializers.IntegerField()
    unread_count = serializers.IntegerField()


class CalendarEventSerializer(serializers.Serializer):
    """Calendar event (booking, inspection, etc.)."""
    id = serializers.UUIDField()
    title = serializers.CharField()
    event_type = serializers.CharField()
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    property_id = serializers.UUIDField(allow_null=True)
    property_title = serializers.CharField(allow_blank=True)


class RealEstateCalendarSerializer(serializers.Serializer):
    """Calendar dashboard data."""
    events = CalendarEventSerializer(many=True)


class MaintenanceTicketSerializer(serializers.Serializer):
    """Maintenance ticket."""
    id = serializers.UUIDField()
    property_id = serializers.UUIDField()
    property_title = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    status = serializers.CharField()
    priority = serializers.CharField()
    created_at = serializers.DateTimeField()
    due_date = serializers.DateField(allow_null=True)


class RealEstateMaintenanceSerializer(serializers.Serializer):
    """Maintenance dashboard data."""
    tickets = MaintenanceTicketSerializer(many=True)
    total_tickets = serializers.IntegerField()
    open_tickets = serializers.IntegerField()
    overdue_tickets = serializers.IntegerField()


class OwnerTenantSerializer(serializers.Serializer):
    """Owner or tenant profile."""
    id = serializers.UUIDField()
    name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(allow_blank=True)
    property_count = serializers.IntegerField()


class RealEstateOwnersAndTenantsSerializer(serializers.Serializer):
    """Owners and tenants dashboard data."""
    owners = OwnerTenantSerializer(many=True)
    tenants = OwnerTenantSerializer(many=True)
    total_owners = serializers.IntegerField()
    total_tenants = serializers.IntegerField()


class PricingSuggestionSerializer(serializers.Serializer):
    """Smart pricing suggestion."""
    property_id = serializers.UUIDField()
    property_title = serializers.CharField()
    current_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    suggested_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    reason = serializers.CharField()


class RealEstatePricingAndPromotionsSerializer(serializers.Serializer):
    """Pricing and promotions dashboard data."""
    suggestions = PricingSuggestionSerializer(many=True)
    active_discounts = serializers.IntegerField()
    avg_discount_percentage = serializers.FloatField()


class ChannelPerformanceSerializer(serializers.Serializer):
    """Performance metrics for a distribution channel."""
    channel_name = serializers.CharField()
    listings_count = serializers.IntegerField()
    bookings_count = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class RealEstateChannelsAndDistributionSerializer(serializers.Serializer):
    """Channels and distribution dashboard data."""
    channels = ChannelPerformanceSerializer(many=True)
    total_channels = serializers.IntegerField()


class ProjectSerializer(serializers.Serializer):
    """Real estate project (off-plan development)."""
    id = serializers.UUIDField()
    name = serializers.CharField()
    location = serializers.CharField()
    total_units = serializers.IntegerField()
    sold_units = serializers.IntegerField()
    reserved_units = serializers.IntegerField()
    available_units = serializers.IntegerField()
    expected_completion = serializers.DateField(allow_null=True)
    status = serializers.CharField()


class RealEstateProjectsSerializer(serializers.Serializer):
    """Projects dashboard data."""
    projects = ProjectSerializer(many=True)
    total_projects = serializers.IntegerField()
    active_projects = serializers.IntegerField()
