/**
 * Edit Listing Modal - Inline edit for price, availability, and status
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Listing } from '../types/realEstateModels';
import { useUpdateListing } from '../hooks/useRealEstateData';

interface EditListingModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditListingModal: React.FC<EditListingModalProps> = ({
  listing,
  isOpen,
  onClose,
}) => {
  const updateListingMutation = useUpdateListing();

  const [formData, setFormData] = useState<Partial<Listing>>({});

  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title,
        base_price: listing.base_price,
        currency: listing.currency,
        price_period: listing.price_period,
        status: listing.status,
        available_from: listing.available_from || undefined,
        available_to: listing.available_to || undefined,
      });
    }
  }, [listing]);

  const handleSubmit = async () => {
    if (!listing) return;

    try {
      await updateListingMutation.mutateAsync({
        id: listing.id,
        data: formData,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update listing:', error);
      // Error is handled by React Query and will be shown in UI
    }
  };

  const isDirty = listing && JSON.stringify(formData) !== JSON.stringify({
    title: listing.title,
    base_price: listing.base_price,
    currency: listing.currency,
    price_period: listing.price_period,
    status: listing.status,
    available_from: listing.available_from || undefined,
    available_to: listing.available_to || undefined,
  });

  if (!listing) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listing: {listing.reference_code}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="pricing" className="mt-4">
          <TabsList>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
          </TabsList>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <div>
              <Label>Base Price</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.base_price || ''}
                onChange={(e) =>
                  setFormData({ ...formData, base_price: e.target.value })
                }
                placeholder="Enter price"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency</Label>
                <select
                  value={formData.currency || 'EUR'}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="USD">USD</option>
                  <option value="TRY">TRY</option>
                </select>
              </div>

              <div>
                <Label>Price Period</Label>
                <select
                  value={formData.price_period || 'TOTAL'}
                  onChange={(e) =>
                    setFormData({ ...formData, price_period: e.target.value as Listing['price_period'] })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="PER_DAY">Per Day</option>
                  <option value="PER_MONTH">Per Month</option>
                  <option value="TOTAL">Total</option>
                  <option value="STARTING_FROM">Starting From</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-lime-50 to-emerald-50 border border-lime-200">
              <div className="font-semibold text-sm text-lime-900 mb-1">Preview</div>
              <div className="text-lg font-bold text-lime-700">
                {formData.price_period === 'STARTING_FROM' && 'From '}
                {formData.currency} {formData.base_price ? parseFloat(formData.base_price).toLocaleString() : '0'}
                {formData.price_period === 'PER_DAY' && '/day'}
                {formData.price_period === 'PER_MONTH' && '/month'}
              </div>
            </div>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-4">
            <div>
              <Label>Available From</Label>
              <Input
                type="date"
                value={formData.available_from || ''}
                onChange={(e) =>
                  setFormData({ ...formData, available_from: e.target.value || null })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty if available immediately
              </p>
            </div>

            <div>
              <Label>Available To</Label>
              <Input
                type="date"
                value={formData.available_to || ''}
                onChange={(e) =>
                  setFormData({ ...formData, available_to: e.target.value || null })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty if available indefinitely
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
              <div className="font-semibold text-sm text-emerald-900 mb-1">Current Availability</div>
              <div className="text-sm text-emerald-700">
                {listing.available_from && listing.available_to
                  ? `${new Date(listing.available_from).toLocaleDateString()} - ${new Date(listing.available_to).toLocaleDateString()}`
                  : listing.available_from
                  ? `From ${new Date(listing.available_from).toLocaleDateString()}`
                  : listing.available_to
                  ? `Until ${new Date(listing.available_to).toLocaleDateString()}`
                  : 'Available now'}
              </div>
            </div>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            <div>
              <Label>Listing Status</Label>
              <select
                value={formData.status || 'DRAFT'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Listing['status'] })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="UNDER_OFFER">Under Offer</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-sm space-y-2">
                <div>
                  <strong>DRAFT:</strong> Not visible to public, still in preparation
                </div>
                <div>
                  <strong>ACTIVE:</strong> Live and available for bookings/inquiries
                </div>
                <div>
                  <strong>INACTIVE:</strong> Temporarily hidden from public listings
                </div>
                <div>
                  <strong>UNDER OFFER:</strong> Being negotiated, no new inquiries
                </div>
                <div>
                  <strong>SOLD/RENTED:</strong> Transaction completed
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter listing title"
              />
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-sm text-amber-700">
                <strong>Note:</strong> For more extensive edits (description, location, features),
                please use the full listing edit page.
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-slate-600">
            {isDirty && (
              <span className="text-amber-600 font-medium">
                ⚠️ You have unsaved changes
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={updateListingMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateListingMutation.isPending || !isDirty}
              className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600"
            >
              {updateListingMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {updateListingMutation.isError && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {updateListingMutation.error instanceof Error ? updateListingMutation.error.message : 'Failed to update listing'}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
