import React from 'react';
import { Listing } from '../../../types/listing';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Gauge, Zap, MapPin } from 'lucide-react';

interface VehicleListingProps {
  listing: Listing;
  onClick?: () => void;
}

export const VehicleListing: React.FC<VehicleListingProps> = ({ listing, onClick }) => {
  const fields = listing.dynamic_fields || {};
  const transactionType = fields.transaction_type || 'sale';
  const vehicleType = fields.vehicle_type?.replace(/_/g, ' ').toUpperCase();
  const make = fields.make;
  const model = fields.model;
  const year = fields.year;
  const mileage = fields.mileage;
  const fuelType = fields.fuel_type?.replace(/_/g, ' ').toUpperCase();
  const transmission = fields.transmission?.toUpperCase();
  const condition = fields.condition?.replace(/_/g, ' ').toUpperCase();

  return (
    <Card
      onClick={onClick}
      className="h-full cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {listing.location}
            </p>
          </div>
          <Badge variant="default" className="ml-2">
            {transactionType.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Price */}
        <div className="text-2xl font-bold">
          {listing.price}
          <span className="text-sm text-muted-foreground ml-1">{listing.currency}</span>
          {transactionType === 'rental' && (
            <span className="text-xs text-muted-foreground ml-1">
              / {fields.rental_period || 'day'}
            </span>
          )}
        </div>

        {/* Vehicle Info */}
        {vehicleType && (
          <Badge variant="secondary" className="w-full justify-center">
            {vehicleType}
          </Badge>
        )}

        {/* Make, Model, Year */}
        <div className="bg-secondary p-2 rounded">
          <p className="text-sm font-semibold">
            {[make, model, year].filter(Boolean).join(' • ')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-2">
          {mileage !== undefined && (
            <div className="bg-secondary p-2 rounded text-center">
              <p className="text-sm font-semibold flex items-center justify-center gap-1">
                <Gauge className="w-3 h-3" />
                {(mileage / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-muted-foreground">Mileage</p>
            </div>
          )}
          {fuelType && (
            <div className="bg-secondary p-2 rounded text-center">
              <p className="text-sm font-semibold flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
              </p>
              <p className="text-xs text-muted-foreground">{fuelType}</p>
            </div>
          )}
          {transmission && (
            <div className="bg-secondary p-2 rounded text-center">
              <p className="text-sm font-semibold">{transmission}</p>
              <p className="text-xs text-muted-foreground">Transmission</p>
            </div>
          )}
          {condition && (
            <div className="bg-secondary p-2 rounded text-center">
              <p className="text-sm font-semibold text-xs">{condition}</p>
              <p className="text-xs text-muted-foreground">Condition</p>
            </div>
          )}
        </div>

        {/* Description Preview */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {listing.description}
        </p>
      </CardContent>
    </Card>
  );
};

export default VehicleListing;
