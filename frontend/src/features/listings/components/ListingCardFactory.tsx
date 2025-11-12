import React from 'react';
import { Listing } from '../../../types/listing';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { MapPin } from 'lucide-react';
import RealEstateListing from './RealEstateListing';
import VehicleListing from './VehicleListing';
import ServiceListing from './ServiceListing';

interface ListingCardProps {
  listing: Listing;
  onClick?: () => void;
}

/**
 * Factory component that renders the appropriate listing card based on category
 */
export const ListingCardFactory: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const categorySlug = listing.category_slug?.toLowerCase();

  // Category-specific components
  if (categorySlug === 'real-estate') {
    return (
      <div onClick={onClick} className="cursor-pointer">
        <RealEstateListing listing={listing} />
      </div>
    );
  }

  if (categorySlug === 'vehicles') {
    return (
      <div onClick={onClick} className="cursor-pointer">
        <VehicleListing listing={listing} />
      </div>
    );
  }

  if (categorySlug === 'services') {
    return (
      <div onClick={onClick} className="cursor-pointer">
        <ServiceListing listing={listing} />
      </div>
    );
  }

  // Fallback: Generic listing card
  return (
    <Card
      onClick={onClick}
      className="h-full cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
            {listing.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {listing.location}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Price */}
        {listing.price && (
          <div className="text-2xl font-bold">
            {listing.price}
            <span className="text-sm text-muted-foreground ml-1">{listing.currency}</span>
          </div>
        )}

        {/* Category Badge */}
        <Badge variant="secondary" className="w-full justify-center">
          {listing.category_name}
        </Badge>

        {/* Description Preview */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {listing.description}
        </p>

        {/* Subcategory */}
        {listing.subcategory_name && (
          <Badge variant="outline">{listing.subcategory_name}</Badge>
        )}

        {/* Status and Views */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{listing.status}</span>
          <span>{listing.views} views</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingCardFactory;
