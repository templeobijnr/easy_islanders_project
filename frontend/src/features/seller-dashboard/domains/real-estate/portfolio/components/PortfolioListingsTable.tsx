/**
 * Portfolio Listings Table - Main table showing all listings
 */

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, ExternalLink, Home, Building2, Tag, Hammer, Wifi, Utensils, Waves, Eye } from 'lucide-react';
import { PortfolioListing, ListingTypeCode, ListingStatus } from '../types';

interface PortfolioListingsTableProps {
  listings: PortfolioListing[];
  onEdit: (listing: PortfolioListing) => void;
}

const LISTING_TYPE_ICONS: Record<ListingTypeCode, React.ElementType> = {
  DAILY_RENTAL: Home,
  LONG_TERM_RENTAL: Building2,
  SALE: Tag,
  PROJECT: Hammer,
};

const LISTING_TYPE_LABELS: Record<ListingTypeCode, string> = {
  DAILY_RENTAL: 'Daily',
  LONG_TERM_RENTAL: 'Long-Term',
  SALE: 'Sale',
  PROJECT: 'Project',
};

const STATUS_COLORS: Record<ListingStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  UNDER_OFFER: 'bg-amber-100 text-amber-800',
  SOLD: 'bg-blue-100 text-blue-800',
  RENTED: 'bg-purple-100 text-purple-800',
};

export const PortfolioListingsTable: React.FC<PortfolioListingsTableProps> = ({
  listings,
  onEdit,
}) => {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No listings found matching your filters.</p>
      </div>
    );
  }

  const formatPrice = (listing: PortfolioListing) => {
    const price = parseFloat(listing.base_price);
    let suffix = '';

    switch (listing.price_period) {
      case 'PER_DAY':
        suffix = '/day';
        break;
      case 'PER_MONTH':
        suffix = '/month';
        break;
      case 'STARTING_FROM':
        return `From ${listing.currency} ${price.toLocaleString()}`;
      case 'TOTAL':
      default:
        suffix = '';
    }

    return `${listing.currency} ${price.toLocaleString()}${suffix}`;
  };

  return (
    <div className="overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[120px]">Ref</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="w-[80px]">Rooms</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[80px] text-center">Views</TableHead>
            <TableHead className="w-[80px] text-center">Enquiries</TableHead>
            <TableHead className="w-[100px]">Features</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => {
            const TypeIcon = LISTING_TYPE_ICONS[listing.listing_type];

            return (
              <TableRow key={listing.id}>
                {/* Type */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">
                      {LISTING_TYPE_LABELS[listing.listing_type]}
                    </span>
                  </div>
                </TableCell>

                {/* Reference */}
                <TableCell className="font-mono text-xs">{listing.reference_code}</TableCell>

                {/* Title */}
                <TableCell>
                  <div className="max-w-xs truncate font-medium">{listing.title}</div>
                </TableCell>

                {/* Location */}
                <TableCell>
                  <div className="text-sm">
                    {listing.city && listing.area ? (
                      <span>
                        {listing.city} · {listing.area}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {listing.city || listing.area || 'N/A'}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Rooms */}
                <TableCell>
                  {listing.room_configuration_label || (
                    <span className="text-muted-foreground">
                      {listing.bedrooms}B {listing.bathrooms}Ba
                    </span>
                  )}
                </TableCell>

                {/* Price */}
                <TableCell>
                  <div className="font-semibold text-sm">{formatPrice(listing)}</div>
                </TableCell>

                {/* Availability */}
                <TableCell>
                  <div className="text-xs">{listing.availability_label}</div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge className={STATUS_COLORS[listing.status]}>{listing.status}</Badge>
                </TableCell>

                {/* Views 30d */}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    {listing.views_30d}
                  </div>
                </TableCell>

                {/* Enquiries 30d */}
                <TableCell className="text-center">
                  <span className="text-sm font-semibold">{listing.enquiries_30d}</span>
                </TableCell>

                {/* Features */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    {listing.has_wifi && <Wifi className="h-3 w-3 text-blue-600" aria-label="WiFi" />}
                    {listing.has_kitchen && <Utensils className="h-3 w-3 text-green-600" aria-label="Kitchen" />}
                    {(listing.has_pool || listing.has_private_pool) && (
                      <Waves className="h-3 w-3 text-cyan-600" aria-label="Pool" />
                    )}
                    {listing.has_sea_view && <Eye className="h-3 w-3 text-purple-600" aria-label="Sea View" />}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(listing)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
