/**
 * Portfolio Summary Row - 4 cards showing stats per listing type
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Building2, Tag, Hammer, TrendingUp, Eye, MessageSquare } from 'lucide-react';
import { PortfolioSummaryResponse, ListingTypeCode } from '../types';

interface PortfolioSummaryRowProps {
  summary: PortfolioSummaryResponse | undefined;
}

const LISTING_TYPE_CONFIG: Record<
  ListingTypeCode,
  {
    label: string;
    icon: React.ElementType;
    color: string;
  }
> = {
  DAILY_RENTAL: {
    label: 'Daily Rentals',
    icon: Home,
    color: 'text-blue-600',
  },
  LONG_TERM_RENTAL: {
    label: 'Long-Term Rentals',
    icon: Building2,
    color: 'text-green-600',
  },
  SALE: {
    label: 'Sales',
    icon: Tag,
    color: 'text-purple-600',
  },
  PROJECT: {
    label: 'Projects',
    icon: Hammer,
    color: 'text-amber-600',
  },
};

export const PortfolioSummaryRow: React.FC<PortfolioSummaryRowProps> = ({ summary }) => {
  const getSummaryItem = (listingType: ListingTypeCode) => {
    return summary?.find((item) => item.listing_type === listingType);
  };

  const renderCard = (listingType: ListingTypeCode) => {
    const config = LISTING_TYPE_CONFIG[listingType];
    const item = getSummaryItem(listingType);
    const Icon = config.icon;

    return (
      <Card key={listingType}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{item?.total_listings || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {item?.active_listings || 0} active
          </p>

          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>Views</span>
              </div>
              <span className="font-semibold">{item?.views_30d || 0}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>Enquiries</span>
              </div>
              <span className="font-semibold">{item?.enquiries_30d || 0}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Bookings</span>
              </div>
              <span className="font-semibold">{item?.bookings_30d || 0}</span>
            </div>
          </div>

          {item?.avg_price && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-muted-foreground">Avg. Price</div>
              <div className="text-sm font-semibold">EUR {parseFloat(item.avg_price).toLocaleString()}</div>
            </div>
          )}

          {item && (item.occupied_units !== undefined || item.vacant_units !== undefined) && (
            <div className="mt-2 pt-2 border-t text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occupied</span>
                <span className="font-semibold">{item.occupied_units || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vacant</span>
                <span className="font-semibold">{item.vacant_units || 0}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {renderCard('DAILY_RENTAL')}
      {renderCard('LONG_TERM_RENTAL')}
      {renderCard('SALE')}
      {renderCard('PROJECT')}
    </div>
  );
};
