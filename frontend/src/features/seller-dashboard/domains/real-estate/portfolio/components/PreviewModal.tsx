import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, X } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    title: string;
    description: string;
    price: number;
    currency: string;
    images: Array<{ url: string; alt: string }>;
    location: string;
    type: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  listing 
}) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Listing Preview</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Image Gallery */}
          {listing.images && listing.images.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2">
                {listing.images.slice(0, 4).map((image, index) => (
                  <div key={index} className={index === 0 ? "col-span-2" : ""}>
                    <img
                      src={image.url}
                      alt={image.alt || `${listing.title} - Image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listing Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {listing.title}
                </h3>
                <Badge variant="secondary">{listing.type}</Badge>
              </div>
              
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {formatPrice(listing.price, listing.currency)}
              </p>
              
              <p className="text-gray-600 dark:text-gray-300 flex items-center">
                <ExternalLink className="w-4 h-4 mr-1" />
                {listing.location}
              </p>
            </div>

            {/* Property Stats */}
            {(listing.bedrooms || listing.bathrooms || listing.area) && (
              <Card className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {listing.bedrooms && (
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {listing.bedrooms}
                      </p>
                      <p className="text-sm text-gray-500">Bedrooms</p>
                    </div>
                  )}
                  {listing.bathrooms && (
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {listing.bathrooms}
                      </p>
                      <p className="text-sm text-gray-500">Bathrooms</p>
                    </div>
                  )}
                  {listing.area && (
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {listing.area}
                      </p>
                      <p className="text-sm text-gray-500">sq ft</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Description */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Description
              </h4>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Listing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};