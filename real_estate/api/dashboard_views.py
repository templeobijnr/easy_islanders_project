"""
Dashboard API views for Real Estate domain.

Provides 13 endpoints for the seller dashboard:
- Overview
- Portfolio
- Location
- Occupancy
- Earnings
- Sales Pipeline
- Requests
- Calendar
- Maintenance
- Owners and Tenants
- Pricing and Promotions
- Channels and Distribution
- Projects
"""
from decimal import Decimal
from datetime import datetime, date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone

from real_estate.models import Listing as REListing
from listings.models import Listing as GenericListing
from bookings.models import Booking

from .dashboard_serializers import (
    RealEstateOverviewSerializer,
    RealEstatePortfolioSerializer,
    RealEstateLocationSerializer,
    RealEstateOccupancySerializer,
    RealEstateEarningsSerializer,
    RealEstateSalesPipelineSerializer,
    RealEstateRequestsSerializer,
    RealEstateCalendarSerializer,
    RealEstateMaintenanceSerializer,
    RealEstateOwnersAndTenantsSerializer,
    RealEstatePricingAndPromotionsSerializer,
    RealEstateChannelsAndDistributionSerializer,
    RealEstateProjectsSerializer,
)


class RealEstateOverviewView(APIView):
    """
    GET /api/dashboard/real-estate/overview

    Returns key metrics for the overview dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        # Get user's properties
        properties = REListing.objects.filter(owner=user)
        total_units = properties.count()

        # Calculate occupancy (based on active bookings)
        occupied_count = 0
        total_revenue = Decimal('0.00')

        # For each property, check if it has active bookings
        for prop in properties:
            if prop.listing:
                active_bookings = Booking.objects.filter(
                    listing=prop.listing,
                    status__in=['confirmed', 'checked_in'],
                    start_date__lte=timezone.now().date(),
                    end_date__gte=timezone.now().date()
                ).exists()
                if active_bookings:
                    occupied_count += 1

        occupancy_rate = (occupied_count / total_units) if total_units > 0 else 0.0

        # Calculate monthly revenue estimate (placeholder logic)
        monthly_revenue = sum([
            prop.monthly_price or prop.nightly_price * 30 or 0
            for prop in properties
            if prop.monthly_price or prop.nightly_price
        ])

        data = {
            "occupancy_rate": round(occupancy_rate, 2),
            "monthly_revenue": str(monthly_revenue),
            "active_deals": 0,  # TODO: wire to actual deals/inquiries
            "new_requests": 0,  # TODO: wire to messaging system
            "total_units": total_units,
            "units_occupied": occupied_count,
        }

        serializer = RealEstateOverviewSerializer(data)
        return Response(serializer.data)


class RealEstatePortfolioView(APIView):
    """
    GET /api/dashboard/real-estate/portfolio

    Returns portfolio breakdown by property.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        properties = REListing.objects.filter(owner=user)

        units = []
        unit_mix = {}
        total_value = Decimal('0.00')

        for prop in properties:
            # Calculate per-property occupancy
            prop_occupancy = 0.0
            if prop.listing:
                active_booking = Booking.objects.filter(
                    listing=prop.listing,
                    status__in=['confirmed', 'checked_in'],
                    start_date__lte=timezone.now().date(),
                    end_date__gte=timezone.now().date()
                ).exists()
                prop_occupancy = 1.0 if active_booking else 0.0

            # Monthly revenue estimate
            monthly_rev = prop.monthly_price or (prop.nightly_price * 30 if prop.nightly_price else 0)
            total_value += monthly_rev or 0

            # Unit mix by property type
            unit_mix[prop.property_type] = unit_mix.get(prop.property_type, 0) + 1

            units.append({
                "id": str(prop.id),
                "title": prop.title,
                "property_type": prop.property_type,
                "bedrooms": prop.bedrooms,
                "bathrooms": float(prop.bathrooms),
                "city": prop.city,
                "status": "active",  # TODO: add status field to model
                "monthly_revenue": str(monthly_rev),
                "occupancy_rate": prop_occupancy,
            })

        data = {
            "units": units,
            "total_units": properties.count(),
            "total_value": str(total_value),
            "unit_mix": unit_mix,
        }

        serializer = RealEstatePortfolioSerializer(data)
        return Response(serializer.data)


class RealEstateLocationView(APIView):
    """
    GET /api/dashboard/real-estate/location

    Returns location-based performance data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        # Group by city
        locations = REListing.objects.filter(owner=user).values('city', 'district').annotate(
            property_count=Count('id'),
            avg_lat=Avg('lat'),
            avg_lng=Avg('lng'),
        )

        areas = []
        for loc in locations:
            # Placeholder occupancy and revenue
            areas.append({
                "city": loc['city'],
                "district": loc.get('district', ''),
                "property_count": loc['property_count'],
                "avg_occupancy": 0.75,  # TODO: calculate real occupancy
                "total_revenue": "10000.00",  # TODO: calculate from bookings
                "latitude": float(loc['avg_lat']) if loc['avg_lat'] else None,
                "longitude": float(loc['avg_lng']) if loc['avg_lng'] else None,
            })

        data = {"areas": areas}
        serializer = RealEstateLocationSerializer(data)
        return Response(serializer.data)


class RealEstateOccupancyView(APIView):
    """
    GET /api/dashboard/real-estate/occupancy

    Returns occupancy time-series data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        properties = REListing.objects.filter(owner=user)
        total_units = properties.count()

        # Generate last 30 days of occupancy data (placeholder)
        series = []
        today = date.today()
        for i in range(30):
            day = today - timedelta(days=29 - i)
            # Placeholder occupancy calculation
            occupied = int(total_units * 0.75)  # 75% occupancy
            series.append({
                "date": day.isoformat(),
                "occupancy_rate": 0.75,
                "units_occupied": occupied,
                "units_vacant": total_units - occupied,
            })

        data = {
            "series": series,
            "current_occupancy_rate": 0.75,
            "avg_occupancy_rate": 0.75,
        }

        serializer = RealEstateOccupancySerializer(data)
        return Response(serializer.data)


class RealEstateEarningsView(APIView):
    """
    GET /api/dashboard/real-estate/earnings

    Returns revenue and expense data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        # Generate last 6 months of revenue data (placeholder)
        revenue_series = []
        total_revenue = Decimal('0.00')
        total_expenses = Decimal('0.00')

        for i in range(6):
            month_date = date.today().replace(day=1) - timedelta(days=i * 30)
            month_str = month_date.strftime('%Y-%m')
            revenue = Decimal('45000.00')
            expenses = Decimal('12000.00')
            total_revenue += revenue
            total_expenses += expenses

            revenue_series.insert(0, {
                "month": month_str,
                "revenue": str(revenue),
                "expenses": str(expenses),
                "net": str(revenue - expenses),
            })

        data = {
            "revenue_series": revenue_series,
            "total_revenue": str(total_revenue),
            "total_expenses": str(total_expenses),
            "net_income": str(total_revenue - total_expenses),
            "pending_payouts": "5200.00",
        }

        serializer = RealEstateEarningsSerializer(data)
        return Response(serializer.data)


class RealEstateSalesPipelineView(APIView):
    """
    GET /api/dashboard/real-estate/sales-pipeline

    Returns sales pipeline funnel data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Placeholder pipeline data
        stages = [
            {"stage": "leads", "count": 45, "total_value": "2250000.00"},
            {"stage": "qualified", "count": 28, "total_value": "1820000.00"},
            {"stage": "viewing", "count": 15, "total_value": "980000.00"},
            {"stage": "offer", "count": 8, "total_value": "520000.00"},
            {"stage": "negotiation", "count": 5, "total_value": "350000.00"},
            {"stage": "closing", "count": 2, "total_value": "140000.00"},
        ]

        data = {
            "stages": stages,
            "total_deals": 103,
            "pipeline_value": "6060000.00",
        }

        serializer = RealEstateSalesPipelineSerializer(data)
        return Response(serializer.data)


class RealEstateRequestsView(APIView):
    """
    GET /api/dashboard/real-estate/requests

    Returns user inquiries and requests.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Placeholder requests data
        # TODO: wire to assistant.models.Message or dedicated inquiry model
        data = {
            "requests": [],
            "total_requests": 0,
            "unread_count": 0,
        }

        serializer = RealEstateRequestsSerializer(data)
        return Response(serializer.data)


class RealEstateCalendarView(APIView):
    """
    GET /api/dashboard/real-estate/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD

    Returns calendar events (bookings, inspections, etc.).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        start_param = request.query_params.get('start')
        end_param = request.query_params.get('end')

        # Parse date range
        try:
            start_date = datetime.fromisoformat(start_param).date() if start_param else date.today()
            end_date = datetime.fromisoformat(end_param).date() if end_param else (date.today() + timedelta(days=30))
        except (ValueError, TypeError):
            start_date = date.today()
            end_date = date.today() + timedelta(days=30)

        # Get user's properties
        property_ids = REListing.objects.filter(owner=user).values_list('listing__id', flat=True)

        # Get bookings in date range
        bookings = Booking.objects.filter(
            listing_id__in=property_ids,
            start_date__lte=end_date,
            end_date__gte=start_date
        ).select_related('listing')

        events = []
        for booking in bookings:
            events.append({
                "id": str(booking.id),
                "title": f"Booking - {booking.listing.title if booking.listing else 'Unknown'}",
                "event_type": "booking",
                "start_datetime": datetime.combine(booking.start_date, datetime.min.time()).isoformat(),
                "end_datetime": datetime.combine(booking.end_date, datetime.min.time()).isoformat(),
                "property_id": str(booking.listing_id) if booking.listing_id else None,
                "property_title": booking.listing.title if booking.listing else "",
            })

        data = {"events": events}
        serializer = RealEstateCalendarSerializer(data)
        return Response(serializer.data)


class RealEstateMaintenanceView(APIView):
    """
    GET /api/dashboard/real-estate/maintenance

    Returns maintenance tickets and scheduled work.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Placeholder maintenance data
        # TODO: create MaintenanceTicket model
        data = {
            "tickets": [],
            "total_tickets": 0,
            "open_tickets": 0,
            "overdue_tickets": 0,
        }

        serializer = RealEstateMaintenanceSerializer(data)
        return Response(serializer.data)


class RealEstateOwnersAndTenantsView(APIView):
    """
    GET /api/dashboard/real-estate/owners-and-tenants

    Returns owners and tenants directory.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Placeholder owners/tenants data
        # TODO: create Lease/Tenancy model
        data = {
            "owners": [],
            "tenants": [],
            "total_owners": 0,
            "total_tenants": 0,
        }

        serializer = RealEstateOwnersAndTenantsSerializer(data)
        return Response(serializer.data)


class RealEstatePricingAndPromotionsView(APIView):
    """
    GET /api/dashboard/real-estate/pricing-and-promotions

    Returns smart pricing suggestions and active promotions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Placeholder pricing data
        data = {
            "suggestions": [],
            "active_discounts": 0,
            "avg_discount_percentage": 0.0,
        }

        serializer = RealEstatePricingAndPromotionsSerializer(data)
        return Response(serializer.data)


class RealEstateChannelsAndDistributionView(APIView):
    """
    GET /api/dashboard/real-estate/channels-and-distribution

    Returns performance by distribution channel.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Placeholder channel data
        channels = [
            {"channel_name": "Direct Website", "listings_count": 45, "bookings_count": 120, "revenue": "85000.00"},
            {"channel_name": "Airbnb", "listings_count": 32, "bookings_count": 95, "revenue": "62000.00"},
            {"channel_name": "Booking.com", "listings_count": 28, "bookings_count": 78, "revenue": "54000.00"},
        ]

        data = {
            "channels": channels,
            "total_channels": len(channels),
        }

        serializer = RealEstateChannelsAndDistributionSerializer(data)
        return Response(serializer.data)


class RealEstateProjectsView(APIView):
    """
    GET /api/dashboard/real-estate/projects

    Returns real estate projects (off-plan developments).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Placeholder projects data
        # TODO: add project support to models
        data = {
            "projects": [],
            "total_projects": 0,
            "active_projects": 0,
        }

        serializer = RealEstateProjectsSerializer(data)
        return Response(serializer.data)
