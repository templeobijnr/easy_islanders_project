import React from 'react';
import { Listing } from '../../../types/listing';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { MapPin, Clock, Star } from 'lucide-react';

interface ServiceListingProps {
  listing: Listing;
  onClick?: () => void;
}

export const ServiceListing: React.FC<ServiceListingProps> = ({ listing, onClick }) => {
  const fields = listing.dynamic_fields || {};
  const serviceType = fields.service_type?.replace(/_/g, ' ').toUpperCase();
  const availability = fields.service_availability?.replace(/_/g, ' ').toUpperCase();
  const serviceArea = fields.service_area;
  const responseTime = fields.response_time_hours;
  const emergency = fields.emergency_available;
  const yearsExperience = fields.years_experience;

  return (
    <Card
      onClick={onClick}
      className="h-full cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
            {serviceArea && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {serviceArea}
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
            {availability && (
              <span className="text-xs text-muted-foreground ml-1">
                ({availability})
              </span>
            )}
          </div>
        )}

        {/* Service Type */}
        {serviceType && (
          <Badge variant="secondary" className="w-full justify-center">
            {serviceType}
          </Badge>
        )}

        {/* Service Details Grid */}
        <div className="grid grid-cols-2 gap-2">
          {responseTime !== undefined && (
            <div className="bg-secondary p-2 rounded text-center">
              <p className="text-sm font-semibold flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                {responseTime}h
              </p>
              <p className="text-xs text-muted-foreground">Response</p>
            </div>
          )}
          {yearsExperience !== undefined && (
            <div className="bg-secondary p-2 rounded text-center">
              <p className="text-sm font-semibold flex items-center justify-center gap-1">
                <Star className="w-3 h-3" />
                {yearsExperience}y
              </p>
              <p className="text-xs text-muted-foreground">Experience</p>
            </div>
          )}
          {emergency && (
            <div className="bg-red-100 p-2 rounded text-center">
              <p className="text-sm font-semibold text-red-700">24/7</p>
              <p className="text-xs text-red-600">Emergency</p>
            </div>
          )}
          {listing.subcategory_name && (
            <div className="bg-secondary p-2 rounded text-center">
              <p className="text-xs font-semibold line-clamp-2">{listing.subcategory_name}</p>
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

export default ServiceListing;
