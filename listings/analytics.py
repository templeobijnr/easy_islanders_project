"""
Analytics module for seller dashboard statistics and insights.

Computes performance metrics, trends, and AI-powered insights
for business sellers using the platform.
"""
from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Listing, BuyerRequest, BroadcastMessage, SellerProfile


def compute_seller_stats(seller):
    """
    Compute comprehensive statistics for a seller.

    Args:
        seller: SellerProfile instance

    Returns:
        dict: Statistics including views, listings, requests, conversion rate
    """
    # Get all seller's listings
    listings = Listing.objects.filter(seller=seller)
    total_listings = listings.count()

    # Total views across all listings
    total_views = sum(listing.views_count for listing in listings if hasattr(listing, 'views_count'))

    # Active listings (status='active')
    active_listings = listings.filter(status='active').count()

    # Buyer requests in seller's categories
    # Note: Assumes SellerProfile has a 'categories' M2M or similar
    # For now, count all unfulfilled requests as potential opportunities
    pending_requests = BuyerRequest.objects.filter(
        is_fulfilled=False
    ).count()

    # Broadcasts statistics
    broadcasts = BroadcastMessage.objects.filter(seller=seller)
    total_broadcasts = broadcasts.count()
    active_broadcasts = broadcasts.filter(status='active').count()
    broadcast_views = sum(b.views_count for b in broadcasts)
    broadcast_responses = sum(b.response_count for b in broadcasts)

    # Conversion rate (pending requests / total listings * 100)
    conversion_rate = round((pending_requests / total_listings) * 100, 2) if total_listings else 0.0

    # Average rating (from SellerProfile)
    avg_rating = seller.rating

    # Recent activity (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_listings = listings.filter(created_at__gte=thirty_days_ago).count()

    return {
        "total_views": total_views,
        "total_listings": total_listings,
        "active_listings": active_listings,
        "pending_requests": pending_requests,
        "conversion_rate": conversion_rate,
        "avg_rating": avg_rating,
        "total_broadcasts": total_broadcasts,
        "active_broadcasts": active_broadcasts,
        "broadcast_views": broadcast_views,
        "broadcast_responses": broadcast_responses,
        "recent_listings_30d": recent_listings,
    }


def compute_category_breakdown(seller):
    """
    Compute listing distribution by category for a seller.

    Args:
        seller: SellerProfile instance

    Returns:
        dict: Category breakdown with counts
    """
    listings = Listing.objects.filter(seller=seller).select_related('category')

    category_data = {}
    for listing in listings:
        if listing.category:
            cat_name = listing.category.name
            if cat_name in category_data:
                category_data[cat_name] += 1
            else:
                category_data[cat_name] = 1

    return category_data


def compute_performance_trends(seller, days=30):
    """
    Compute performance trends over specified time period.

    Args:
        seller: SellerProfile instance
        days: Number of days to analyze (default: 30)

    Returns:
        dict: Trend data including view growth, listing growth
    """
    start_date = timezone.now() - timedelta(days=days)

    # New listings in period
    new_listings = Listing.objects.filter(
        seller=seller,
        created_at__gte=start_date
    ).count()

    # New broadcasts in period
    new_broadcasts = BroadcastMessage.objects.filter(
        seller=seller,
        created_at__gte=start_date
    ).count()

    # View growth (would need historical tracking for accurate calculation)
    # Simplified: current total views as proxy
    listings = Listing.objects.filter(seller=seller)
    current_views = sum(l.views_count for l in listings if hasattr(l, 'views_count'))

    return {
        "period_days": days,
        "new_listings": new_listings,
        "new_broadcasts": new_broadcasts,
        "current_total_views": current_views,
        "start_date": start_date.isoformat(),
        "end_date": timezone.now().isoformat(),
    }


def get_ai_insights(seller):
    """
    Generate AI-powered insights and recommendations for seller.

    Args:
        seller: SellerProfile instance

    Returns:
        list: List of insight strings
    """
    insights = []

    stats = compute_seller_stats(seller)

    # Insight: Low listing count
    if stats['total_listings'] < 3:
        insights.append(
            "💡 Tip: Adding more listings increases visibility and chances of connecting with buyers."
        )

    # Insight: High conversion rate
    if stats['conversion_rate'] > 50:
        insights.append(
            "🎉 Great performance! Your conversion rate is above average."
        )

    # Insight: No broadcasts
    if stats['total_broadcasts'] == 0:
        insights.append(
            "📣 Consider creating a broadcast to promote your listings to targeted buyers."
        )

    # Insight: Low rating
    if stats['avg_rating'] < 3.5 and stats['avg_rating'] > 0:
        insights.append(
            "⭐ Focus on improving customer satisfaction to boost your rating."
        )

    # Insight: Pending requests
    if stats['pending_requests'] > 5:
        insights.append(
            f"📬 {stats['pending_requests']} buyer requests are waiting for responses. Don't miss opportunities!"
        )

    # Insight: Recent activity
    if stats['recent_listings_30d'] == 0:
        insights.append(
            "📆 No new listings in the last 30 days. Consider refreshing your inventory."
        )

    # Insight: Active broadcasts
    if stats['active_broadcasts'] > 0:
        insights.append(
            f"📊 You have {stats['active_broadcasts']} active broadcast(s) reaching potential buyers."
        )

    # Default positive insight
    if not insights:
        insights.append(
            "✨ Your seller profile is active! Keep engaging with buyers for best results."
        )

    return insights


def compute_dashboard_summary(seller):
    """
    Compute complete dashboard summary combining stats, trends, and insights.

    Args:
        seller: SellerProfile instance

    Returns:
        dict: Complete dashboard data
    """
    return {
        "stats": compute_seller_stats(seller),
        "category_breakdown": compute_category_breakdown(seller),
        "trends": compute_performance_trends(seller, days=30),
        "insights": get_ai_insights(seller),
    }
