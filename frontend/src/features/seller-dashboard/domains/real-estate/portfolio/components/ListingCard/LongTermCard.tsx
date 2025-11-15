/**
 * LongTermCard - Card for long-term rental listings
 *
 * Displays metrics like applications, tenant info, messages
 */

import React from 'react';
import { FileText, MessageSquare, Eye, Edit, Trash2, UserCheck } from 'lucide-react';
import { ListingCard, ListingCardAction } from './ListingCard';

interface LongTermData {
  id: string;
  title: string;
  reference_code?: string;
  image_url?: string;
  base_price: number;
  currency: string;
  status: 'available' | 'rented' | 'unavailable';

  // Metrics
  new_messages: number;
  applications: number;
  views_30d: number;

  // Current tenant
  current_tenant?: {
    name: string;
    lease_until: string;
  };
}

interface LongTermCardProps {
  listing: LongTermData;
  onMessageClick: () => void;
  onApplicationsClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkAsRented?: () => void;
  onViewTenant?: () => void;
}

export const LongTermCard: React.FC<LongTermCardProps> = ({
  listing,
  onMessageClick,
  onApplicationsClick,
  onEdit,
  onDelete,
  onMarkAsRented,
  onViewTenant,
}) => {
  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: listing.currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(listing.base_price);

  // Format lease end date
  const formatLeaseEnd = () => {
    if (!listing.current_tenant) return null;

    const leaseEnd = new Date(listing.current_tenant.lease_until);
    return leaseEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Status mapping
  const statusConfig = {
    available: { label: 'Available', variant: 'active' as const },
    rented: { label: 'Rented', variant: 'success' as const },
    unavailable: { label: 'Unavailable', variant: 'inactive' as const },
  };

  // Metrics
  const metrics = [
    {
      icon: '💬',
      label: listing.new_messages > 0
        ? `${listing.new_messages} new message${listing.new_messages !== 1 ? 's' : ''}`
        : 'No new messages',
      onClick: onMessageClick,
      highlight: listing.new_messages > 0,
    },
    {
      icon: '📝',
      label: listing.applications > 0
        ? `${listing.applications} application${listing.applications !== 1 ? 's' : ''}`
        : 'No pending applications',
      onClick: onApplicationsClick,
      highlight: listing.applications > 0,
    },
    {
      icon: '👁',
      label: `${listing.views_30d} views (30 days)`,
    },
  ];

  // Add tenant info if rented
  if (listing.current_tenant) {
    if (onViewTenant) {
      metrics.push({
        icon: '👤',
        label: `Tenant: ${listing.current_tenant.name}`,
        onClick: onViewTenant,
      });
    } else {
      metrics.push({
        icon: '👤',
        label: `Tenant: ${listing.current_tenant.name}`,
      });
    }
    metrics.push({
      icon: '📅',
      label: `Lease until ${formatLeaseEnd()}`,
    });
  }

  // Primary actions
  const primaryActions: ListingCardAction[] = [
    {
      label: 'Applications',
      icon: <FileText className="h-4 w-4" />,
      onClick: onApplicationsClick,
      variant: listing.applications > 0 ? 'primary' : 'default',
    },
    {
      label: 'Messages',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: onMessageClick,
    },
  ];

  // Menu actions
  const menuActions: ListingCardAction[] = [
    {
      label: 'Edit Listing',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
    },
  ];

  if (listing.status === 'available' && onMarkAsRented) {
    menuActions.push({
      label: 'Mark as Rented',
      icon: <UserCheck className="h-4 w-4" />,
      onClick: onMarkAsRented,
    });
  }

  if (listing.current_tenant && onViewTenant) {
    menuActions.push({
      label: 'View Tenant Details',
      icon: <UserCheck className="h-4 w-4" />,
      onClick: onViewTenant,
    });
  }

  menuActions.push({
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'danger',
  });

  return (
    <ListingCard
      imageUrl={listing.image_url}
      imageFallback="No Image"
      title={listing.title}
      subtitle={listing.reference_code}
      price={formattedPrice}
      priceLabel="per month"
      status={statusConfig[listing.status]}
      metrics={metrics}
      primaryActions={primaryActions}
      menuActions={menuActions}
    />
  );
};

/**
 * Example usage:
 *
 * <LongTermCard
 *   listing={{
 *     id: '456',
 *     title: 'Modern City Apartment',
 *     reference_code: 'LTR-002',
 *     base_price: 850,
 *     currency: 'EUR',
 *     status: 'rented',
 *     new_messages: 1,
 *     applications: 0,
 *     views_30d: 23,
 *     current_tenant: {
 *       name: 'John Smith',
 *       lease_until: '2024-12-31'
 *     }
 *   }}
 *   onMessageClick={() => console.log('Open messages')}
 *   onApplicationsClick={() => console.log('Open applications')}
 *   onEdit={() => console.log('Edit listing')}
 *   onDelete={() => console.log('Delete listing')}
 * />
 */
