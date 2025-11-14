import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import config from '@/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type Category = {
  id: string;
  slug: string;
  name: string;
  subcategories?: { id: number; slug: string; name: string }[];
};

const PROPERTY_TYPES = [
  'apartment',
  'villa',
  'studio',
  'house',
  'penthouse',
  'duplex',
  'bungalow',
  'office',
  'shop_retail',
  'land_plot',
];

export const RealEstatePropertyUpload: React.FC<Props> = ({ open, onOpenChange, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Basic
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('apartment');
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [bathrooms, setBathrooms] = useState<number>(1);

  // Location
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  // Rent/pricing
  const [rentType, setRentType] = useState<'short_term' | 'long_term' | 'both'>('long_term');
  const [currency, setCurrency] = useState('EUR');
  const [nightlyPrice, setNightlyPrice] = useState<string>('');
  const [minNights, setMinNights] = useState<string>('');
  const [monthlyPrice, setMonthlyPrice] = useState<string>('');
  const [availableFrom, setAvailableFrom] = useState<string>('');
  const [minTermMonths, setMinTermMonths] = useState<string>('');
  const [deposit, setDeposit] = useState<string>('');

  const realEstateCategory = useMemo(() => {
    return categories.find(
      (c) =>
        c.slug === 'real_estate' ||
        c.slug === 'real-estate' ||
        c.slug === 'accommodation' ||
        (c.name || '').toLowerCase().includes('real estate')
    );
  }, [categories]);

  useEffect(() => {
    if (!open) return;
    // Load categories to resolve real_estate category + subcategories
    (async () => {
      setCategoriesLoading(true);
      setError(null);
      try {
        const resp = await axios.get(`${config.API_BASE_URL}/api/categories/`);
        const cats: Category[] = resp.data?.categories || [];
        setCategories(cats);
        const found = cats.find(
          (c) =>
            c.slug === 'real_estate' ||
            c.slug === 'real-estate' ||
            (c.name || '').toLowerCase().includes('real estate')
        );
        if (!found && cats.length) {
          // Surface helpful info for developers
          // eslint-disable-next-line no-console
          console.warn('Real Estate category not found. Available slugs:', cats.map((c) => c.slug));
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load categories:', e);
        setError('Failed to load categories. Please refresh and try again.');
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, [open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPropertyType('apartment');
    setBedrooms(1);
    setBathrooms(1);
    setCity('');
    setDistrict('');
    setLat('');
    setLng('');
    setRentType('long_term');
    setCurrency('EUR');
    setNightlyPrice('');
    setMinNights('');
    setMonthlyPrice('');
    setAvailableFrom('');
    setMinTermMonths('');
    setDeposit('');
    setImages([]);
    setError(null);
  };

  const onClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setImages(Array.from(e.target.files));
  };

  const resolveSubcategoryId = (): number | undefined => {
    const subs = realEstateCategory?.subcategories || [];
    const match = subs.find(s => s.slug === propertyType || s.slug.replace('-', '_') === propertyType);
    return match?.id;
  };

  const onSubmit = async () => {
    if (categoriesLoading) {
      setError('Categories are still loading. Please wait...');
      return;
    }

    if (!title.trim() || !city.trim()) {
      const missing: string[] = [];
      if (!title.trim()) missing.push('Title');
      if (!city.trim()) missing.push('City');
      setError(`${missing.join(' and ')} ${missing.length === 1 ? 'is' : 'are'} required.`);
      return;
    }

    if (!realEstateCategory) {
      setError('Real Estate category not found. Please refresh the page or contact support.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');

      // Determine representative price for generic listing
      const price = rentType === 'short_term' ? Number(nightlyPrice || 0) : Number(monthlyPrice || 0);
      const transaction_type = rentType === 'short_term' ? 'rent_short' : 'rent_long';

      const payload: any = {
        title,
        description,
        category: realEstateCategory.id,
        subcategory: resolveSubcategoryId(),
        price: isFinite(price) ? price : null,
        currency,
        location: city,
        dynamic_fields: {
          rental_term: rentType,
          bedrooms,
          bathrooms,
          available_from: availableFrom || undefined,
          min_term_months: minTermMonths ? Number(minTermMonths) : undefined,
          deposit: deposit ? Number(deposit) : undefined,
          min_nights: minNights ? Number(minNights) : undefined,
        },
        domain: 'real_estate',
        transaction_type,
      };

      // Optional lat/lng
      if (lat) payload.latitude = Number(lat);
      if (lng) payload.longitude = Number(lng);

      const createResp = await axios.post(`${config.API_BASE_URL}/api/listings/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listingId: string = createResp.data?.id;

      // Upload images to generic listing
      for (const file of images) {
        const fd = new FormData();
        fd.append('image', file);
        await axios.post(`${config.API_BASE_URL}/api/listings/${listingId}/upload-image/`, fd, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to create property. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl p-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-background/95 backdrop-blur">
          <DialogTitle>Create New Property</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}

          {categoriesLoading ? (
            <div className="p-3 rounded-md bg-blue-50 text-blue-700 text-sm border border-blue-200">
              Loading categories...
            </div>
          ) : realEstateCategory ? (
            <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm border border-green-200">
              ✓ Category: {realEstateCategory.name}
            </div>
          ) : categories.length > 0 ? (
            <div className="p-3 rounded-md bg-yellow-50 text-yellow-700 text-sm border border-yellow-200">
              ⚠ Real Estate category not found. Available: {categories.map((c) => c.name).join(', ')}
            </div>
          ) : null}

          {/* Basic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Spacious 2BR Apartment in Kyrenia" />
            </div>
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select value={propertyType} onValueChange={(v) => setPropertyType(v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(pt => (
                    <SelectItem key={pt} value={pt}>{pt.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Input type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value || 0))} />
            </div>
            <div className="space-y-2">
              <Label>Bathrooms</Label>
              <Input type="number" step="0.5" min={0} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value || 0))} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the property..." />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kyrenia" />
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Alsancak" />
            </div>
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="35.3368" />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="33.3173" />
            </div>
          </div>

          {/* Rent & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rent Type</Label>
              <Select value={rentType} onValueChange={(v) => setRentType(v as any)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_term">Short-term</SelectItem>
                  <SelectItem value="long_term">Long-term</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v)}>
                <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>
                  {['EUR','GBP','USD','TRY'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(rentType === 'short_term' || rentType === 'both') && (
              <>
                <div className="space-y-2">
                  <Label>Nightly Price</Label>
                  <Input type="number" min={0} value={nightlyPrice} onChange={(e) => setNightlyPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Nights</Label>
                  <Input type="number" min={0} value={minNights} onChange={(e) => setMinNights(e.target.value)} />
                </div>
              </>
            )}

            {(rentType === 'long_term' || rentType === 'both') && (
              <>
                <div className="space-y-2">
                  <Label>Monthly Price</Label>
                  <Input type="number" min={0} value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Available From</Label>
                  <Input type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Term (months)</Label>
                  <Input type="number" min={0} value={minTermMonths} onChange={(e) => setMinTermMonths(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Deposit</Label>
                  <Input type="number" min={0} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
                </div>
              </>
            )}
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Images</Label>
            <Input type="file" multiple onChange={handleFiles} />
            {images.length > 0 && (
              <div className="text-xs text-muted-foreground">{images.length} file(s) selected</div>
            )}
          </div>

          <div className="h-2" />
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t bg-background flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={onSubmit} disabled={loading}>{loading ? 'Creating...' : 'Add Property'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RealEstatePropertyUpload;
