/**
 * Enhanced Real Estate Property Upload Modal
 * Features:
 * - All new fields (ad_number, is_for_sale, sale_price, etc.)
 * - Map-based location picker with reverse geocoding
 * - Enhanced image/video upload with previews and reordering
 * - Better UX with organized sections
 */
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import config from '@/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import LocationMapPicker from '@/components/ui/LocationMapPicker';
import ImageUploadWithPreview from '@/components/ui/ImageUploadWithPreview';
import { Home, MapPin, DollarSign, Image as ImageIcon, Info } from 'lucide-react';

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
  'room',
  'student_accommodation',
  'holiday_home',
  'office',
  'shop_retail',
  'warehouse',
  'industrial',
  'coworking',
  'land_plot',
  'building_project',
];

export const RealEstatePropertyUploadEnhanced: React.FC<Props> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [useMapPicker, setUseMapPicker] = useState(false);

  // Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [adNumber, setAdNumber] = useState('');
  const [propertyType, setPropertyType] = useState('apartment');
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [yearBuilt, setYearBuilt] = useState<string>('');
  const [parkingSpaces, setParkingSpaces] = useState<string>('');

  // Features
  const [furnished, setFurnished] = useState<boolean | null>(null);
  const [petFriendly, setPetFriendly] = useState<boolean | null>(null);

  // Location
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  // Transaction Type
  const [isForSale, setIsForSale] = useState(false);
  const [rentType, setRentType] = useState<'short_term' | 'long_term' | 'both'>('long_term');

  // Pricing
  const [currency, setCurrency] = useState('EUR');
  const [salePrice, setSalePrice] = useState<string>('');
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
    // Load categories
    (async () => {
      setCategoriesLoading(true);
      setError(null);
      try {
        const resp = await axios.get(`${config.API_BASE_URL}/api/categories/`);
        const cats: Category[] = resp.data?.categories || [];
        setCategories(cats);
      } catch (e) {
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
    setAdNumber('');
    setPropertyType('apartment');
    setBedrooms(1);
    setBathrooms(1);
    setYearBuilt('');
    setParkingSpaces('');
    setFurnished(null);
    setPetFriendly(null);
    setCity('');
    setDistrict('');
    setLat('');
    setLng('');
    setIsForSale(false);
    setRentType('long_term');
    setCurrency('EUR');
    setSalePrice('');
    setNightlyPrice('');
    setMinNights('');
    setMonthlyPrice('');
    setAvailableFrom('');
    setMinTermMonths('');
    setDeposit('');
    setImages([]);
    setError(null);
    setUseMapPicker(false);
  };

  const onClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const resolveSubcategoryId = (): number | undefined => {
    const subs = realEstateCategory?.subcategories || [];
    const match = subs.find((s) => s.slug === propertyType || s.slug.replace('-', '_') === propertyType);
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

      // Determine price and transaction type
      let price: number | null = null;
      let transaction_type = 'rent_long';

      if (isForSale) {
        price = Number(salePrice || 0);
        transaction_type = 'sale';
      } else {
        if (rentType === 'short_term') {
          price = Number(nightlyPrice || 0);
          transaction_type = 'rent_short';
        } else {
          price = Number(monthlyPrice || 0);
          transaction_type = 'rent_long';
        }
      }

      const payload: any = {
        title,
        description,
        category: realEstateCategory.id,
        subcategory: resolveSubcategoryId(),
        price: isFinite(price) ? price : null,
        currency,
        location: city,
        dynamic_fields: {
          ad_number: adNumber || undefined,
          rental_term: !isForSale ? rentType : undefined,
          bedrooms,
          bathrooms,
          year_built: yearBuilt ? Number(yearBuilt) : undefined,
          parking_spaces: parkingSpaces ? Number(parkingSpaces) : undefined,
          furnished: furnished !== null ? furnished : undefined,
          pet_friendly: petFriendly !== null ? petFriendly : undefined,
          available_from: !isForSale && availableFrom ? availableFrom : undefined,
          min_term_months: !isForSale && minTermMonths ? Number(minTermMonths) : undefined,
          deposit: !isForSale && deposit ? Number(deposit) : undefined,
          min_nights: !isForSale && minNights ? Number(minNights) : undefined,
          is_for_sale: isForSale,
          sale_price: isForSale && salePrice ? Number(salePrice) : undefined,
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

      // Upload images
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
      <DialogContent className="w-[95vw] sm:max-w-4xl p-0 h-[85vh] max-h-[90vh] grid grid-rows-[auto_1fr_auto] !grid-cols-1 overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-background/95 backdrop-blur">
          <DialogTitle>Create New Property</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4 min-h-0">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}

          {categoriesLoading ? (
            <div className="p-3 rounded-md bg-blue-50 text-blue-700 text-sm border border-blue-200">
              Loading categories...
            </div>
          ) : realEstateCategory ? (
            <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 text-sm border border-green-200">
              ✓ Category: {realEstateCategory.name}
            </div>
          ) : (
            categories.length > 0 && (
              <div className="mb-4 p-3 rounded-md bg-yellow-50 text-yellow-700 text-sm border border-yellow-200">
                ⚠ Real Estate category not found. Available: {categories.map((c) => c.name).join(', ')}
              </div>
            )
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">
                <Home className="h-4 w-4 mr-2" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="location">
                <MapPin className="h-4 w-4 mr-2" />
                Location
              </TabsTrigger>
              <TabsTrigger value="pricing">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="media">
                <ImageIcon className="h-4 w-4 mr-2" />
                Media
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Spacious 2BR Apartment in Kyrenia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-number">Ad Number / Reference</Label>
                  <Input
                    id="ad-number"
                    value={adNumber}
                    onChange={(e) => setAdNumber(e.target.value)}
                    placeholder="RE-2024-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select value={propertyType} onValueChange={(v) => setPropertyType(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((pt) => (
                        <SelectItem key={pt} value={pt}>
                          {pt.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Input
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value || 0))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min={0}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value || 0))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year-built">Year Built</Label>
                  <Input
                    id="year-built"
                    type="number"
                    min={1800}
                    max={new Date().getFullYear() + 5}
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    placeholder={`e.g., ${new Date().getFullYear()}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parking">Parking Spaces</Label>
                  <Input
                    id="parking"
                    type="number"
                    min={0}
                    value={parkingSpaces}
                    onChange={(e) => setParkingSpaces(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="furnished"
                    checked={furnished === true}
                    onCheckedChange={(checked: boolean) => setFurnished(checked ? true : null)}
                  />
                  <Label htmlFor="furnished" className="cursor-pointer">
                    Furnished
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="pet-friendly"
                    checked={petFriendly === true}
                    onCheckedChange={(checked: boolean) => setPetFriendly(checked ? true : null)}
                  />
                  <Label htmlFor="pet-friendly" className="cursor-pointer">
                    Pet Friendly
                  </Label>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the property..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label>Location Entry Method</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="use-map" className="text-sm text-muted-foreground cursor-pointer">
                    {useMapPicker ? 'Using Map' : 'Manual Entry'}
                  </Label>
                  <Switch
                    id="use-map"
                    checked={useMapPicker}
                    onCheckedChange={setUseMapPicker}
                  />
                </div>
              </div>

              {useMapPicker ? (
                <LocationMapPicker
                  onLocationSelect={(location) => {
                    setLat(location.lat.toFixed(6));
                    setLng(location.lng.toFixed(6));
                    if (location.city) setCity(location.city);
                    if (location.district) setDistrict(location.district);
                  }}
                  initialPosition={
                    lat && lng
                      ? { lat: parseFloat(lat), lng: parseFloat(lng) }
                      : { lat: 35.3368, lng: 33.3173 }
                  }
                  height="500px"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Kyrenia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Alsancak"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="35.3368"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="33.3173"
                    />
                  </div>
                </div>
              )}

              {lat && lng && (
                <div className="p-3 rounded-md bg-blue-50 text-blue-700 text-sm border border-blue-200">
                  <Info className="inline h-4 w-4 mr-1" />
                  Coordinates: {parseFloat(lat).toFixed(6)}, {parseFloat(lng).toFixed(6)}
                </div>
              )}
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="flex items-center space-x-2 p-4 rounded-lg border bg-muted/50">
                <Switch
                  id="is-for-sale"
                  checked={isForSale}
                  onCheckedChange={setIsForSale}
                />
                <Label htmlFor="is-for-sale" className="cursor-pointer font-medium">
                  For Sale (instead of rent)
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {['EUR', 'GBP', 'USD', 'TRY'].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isForSale ? (
                  <div className="space-y-2">
                    <Label htmlFor="sale-price">Sale Price</Label>
                    <Input
                      id="sale-price"
                      type="number"
                      min={0}
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="350000"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Rent Type</Label>
                      <Select value={rentType} onValueChange={(v) => setRentType(v as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short_term">Short-term</SelectItem>
                          <SelectItem value="long_term">Long-term</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(rentType === 'short_term' || rentType === 'both') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="nightly-price">Nightly Price</Label>
                          <Input
                            id="nightly-price"
                            type="number"
                            min={0}
                            value={nightlyPrice}
                            onChange={(e) => setNightlyPrice(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="min-nights">Minimum Nights</Label>
                          <Input
                            id="min-nights"
                            type="number"
                            min={0}
                            value={minNights}
                            onChange={(e) => setMinNights(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {(rentType === 'long_term' || rentType === 'both') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="monthly-price">Monthly Price</Label>
                          <Input
                            id="monthly-price"
                            type="number"
                            min={0}
                            value={monthlyPrice}
                            onChange={(e) => setMonthlyPrice(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="available-from">Available From</Label>
                          <Input
                            id="available-from"
                            type="date"
                            value={availableFrom}
                            onChange={(e) => setAvailableFrom(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="min-term">Minimum Term (months)</Label>
                          <Input
                            id="min-term"
                            type="number"
                            min={0}
                            value={minTermMonths}
                            onChange={(e) => setMinTermMonths(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deposit">Deposit</Label>
                          <Input
                            id="deposit"
                            type="number"
                            min={0}
                            value={deposit}
                            onChange={(e) => setDeposit(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="mt-4">
              <ImageUploadWithPreview
                onFilesChange={(files) => setImages(files)}
                maxFiles={10}
                maxSizeMB={10}
                allowVideos={true}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-6 py-4 border-t bg-background flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Add Property'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RealEstatePropertyUploadEnhanced;
