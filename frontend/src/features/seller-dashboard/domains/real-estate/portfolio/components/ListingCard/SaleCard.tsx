/**
 * SaleCard - Card for property sale listings
 *
 * Displays metrics like offers, viewing requests, price history
 */

import React from 'react';
import { Eye, MessageSquare, DollarSign, Edit, Trash2, TrendingDown } from 'lucide-react';
import { ListingCard, ListingCardAction } from './ListingCard';

interface SaleData {
  id: string;
  title: string;
  reference_code?: string;
  image_url?: string;
  base_price: number;
  currency: string;
  status: 'active' | 'under-offer' | 'sold';

  // Metrics
  new_messages: number;
  offers_received: number;
  viewing_requests: number;
  views_30d: number;

  // Price history
  price_history?: {
    original: number;
    current: number;
    reduced_count: number;
  };
}

interface SaleCardProps {
  listing: SaleData;
  onMessageClick: () => void;
  onViewingsClick: () => void;
  onOffersClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAdjustPrice?: () => void;
  onMarkAsSold?: () => void;
}

export const SaleCard: React.FC<SaleCardProps> = ({
  listing,
  onMessageClick,
  onViewingsClick,
  onOffersClick,
  onEdit,
  onDelete,
  onAdjustPrice,
  onMarkAsSold,
}) => {
  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: listing.currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(listing.base_price);

  // Calculate price reduction
  const priceReduction = listing.price_history
    ? ((listing.price_history.original - listing.price_history.current) / listing.price_history.original) * 100
    : 0;

  // Status mapping
  const statusConfig = {
    active: { label: 'Active', variant: 'active' as const },
    'under-offer': { label: 'Under Offer', variant: 'warning' as const },
    sold: { label: 'Sold', variant: 'success' as const },
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
      icon: '💰',
      label: listing.offers_received > 0
        ? `${listing.offers_received} offer${listing.offers_received !== 1 ? 's' : ''} received`
        : 'No offers yet',
      onClick: onOffersClick,
      highlight: listing.offers_received > 0,
    },
    {
      icon: '👁',
      label: listing.viewing_requests > 0
        ? `${listing.viewing_requests} viewing request${listing.viewing_requests !== 1 ? 's' : ''}`
        : 'No viewing requests',
      onClick: onViewingsClick,
      highlight: listing.viewing_requests > 0,
    },
    {
      icon: '📊',
      label: `${listing.views_30d} views (30 days)`,
    },
  ];

  // Add price reduction if applicable
  if (listing.price_history && listing.price_history.reduced_count > 0) {
    metrics.push({
      icon: '📉',
      label: `Price reduced ${priceReduction.toFixed(1)}% (${listing.price_history.reduced_count}x)`,
    });
  }

  // Primary actions
  const primaryActions: ListingCardAction[] = [
    {
      label: 'Viewings',
      icon: <Eye className="h-4 w-4" />,
      onClick: onViewingsClick,
      variant: listing.viewing_requests > 0 ? 'primary' : 'default',
    },
    {
      label: 'Offers',
      icon: <DollarSign className="h-4 w-4" />,
      onClick: onOffersClick,
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

  if (onAdjustPrice) {
    menuActions.push({
      label: 'Adjust Price',
      icon: <DollarSign className="h-4 w-4" />,
      onClick: onAdjustPrice,
    });
  }

  if (listing.status !== 'sold' && onMarkAsSold) {
    menuActions.push({
      label: 'Mark as Sold',
      icon: <TrendingDown className="h-4 w-4" />,
      onClick: onMarkAsSold,
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
      priceLabel={listing.price_history?.reduced_count ? 'reduced price' : undefined}
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
 * <SaleCard
 *   listing={{
 *     id: '789',
 *     title: 'Luxury Villa with Pool',
 *     reference_code: 'SALE-003',
 *     base_price: 450000,
 *     currency: 'EUR',
 *     status: 'active',
 *     new_messages: 2,
 *     offers_received: 1,
 *     viewing_requests: 5,
 *     views_30d: 89,
 *     price_history: {
 *       original: 500000,
 *       current: 450000,
 *       reduced_count: 1
 *     }
 *   }}
 *   onMessageClick={() => console.log('Open messages')}
 *   onViewingsClick={() => console.log('Open viewings')}
 *   onOffersClick={() => console.log('Open offers')}
 *   onEdit={() => console.log('Edit listing')}
 *   onDelete={() => console.log('Delete listing')}
 * />
 */
