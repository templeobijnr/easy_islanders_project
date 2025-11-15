/**
 * ListingHealthBadge Component
 *
 * Displays a visual health indicator (traffic light: 🟢🟡🔴) based on listing completeness and performance
 */

import React from 'react';
import { PortfolioListing } from '../types';

interface ListingHealthBadgeProps {
  listing: PortfolioListing;
  showLabel?: boolean;
  className?: string;
}

export type HealthScore = {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'needs-work' | 'incomplete';
  color: 'green' | 'yellow' | 'red';
  issues: string[];
};

export const calculateListingHealth = (listing: PortfolioListing): HealthScore => {
  let score = 0;
  const issues: string[] = [];

  // Completeness checks (50 points total)
  if (listing.title && listing.title.length > 10) {
    score += 10;
  } else {
    issues.push('Title too short or missing');
  }

  if (listing.base_price && parseFloat(listing.base_price) > 0) {
    score += 10;
  } else {
    issues.push('Price not set');
  }

  if (listing.bedrooms !== null && listing.bathrooms !== null) {
    score += 5;
  } else {
    issues.push('Missing room details');
  }

  if (listing.city && listing.area) {
    score += 10;
  } else {
    issues.push('Location incomplete');
  }

  // Assume photos/description exist if has basic amenities
  const hasAmenities = listing.has_wifi || listing.has_kitchen || listing.has_pool;
  if (hasAmenities) {
    score += 15;
  } else {
    issues.push('No amenities listed');
  }

  // Performance checks (50 points total)
  if (listing.status === 'ACTIVE') {
    score += 20;
  } else if (listing.status === 'DRAFT') {
    issues.push('Still in draft');
  } else if (listing.status === 'INACTIVE') {
    issues.push('Listing is inactive');
  }

  // Views/engagement
  if (listing.views_30d > 0) {
    score += 10;
    if (listing.views_30d > 10) score += 5; // Bonus for good views
  } else if (listing.status === 'ACTIVE') {
    issues.push('No views in 30 days');
  }

  // Bookings/enquiries
  if (listing.bookings_30d > 0) {
    score += 15;
  } else if (listing.enquiries_30d > 0) {
    score += 10;
  } else if (listing.status === 'ACTIVE' && listing.views_30d > 5) {
    issues.push('Views but no enquiries');
  }

  // Determine status
  let status: HealthScore['status'];
  let color: HealthScore['color'];

  if (score >= 80) {
    status = 'excellent';
    color = 'green';
  } else if (score >= 60) {
    status = 'good';
    color = 'yellow';
  } else if (score >= 40) {
    status = 'needs-work';
    color = 'yellow';
  } else {
    status = 'incomplete';
    color = 'red';
  }

  return { score, status, color, issues };
};

export const ListingHealthBadge: React.FC<ListingHealthBadgeProps> = ({
  listing,
  showLabel = false,
  className = '',
}) => {
  const health = calculateListingHealth(listing);

  const colorClasses = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-rose-500',
  };

  const statusLabels = {
    excellent: 'Excellent',
    good: 'Good',
    'needs-work': 'Needs Work',
    incomplete: 'Incomplete',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`h-2.5 w-2.5 rounded-full ${colorClasses[health.color]}`}
        title={`Health: ${health.score}/100 - ${health.issues.length > 0 ? health.issues.join(', ') : 'All good!'}`}
      />
      {showLabel && (
        <span className="text-xs text-slate-600">{statusLabels[health.status]}</span>
      )}
    </div>
  );
};
