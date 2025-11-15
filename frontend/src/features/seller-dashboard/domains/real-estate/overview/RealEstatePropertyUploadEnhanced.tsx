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

// Property types aligned with backend real_estate.PropertyType model
const PROPERTY_TYPES = [
  // Residential
  { value: 'apartment', label: 'Apartment', backendCode: 'APARTMENT' },
  { value: 'penthouse', label: 'Penthouse', backendCode: 'PENTHOUSE' },
  { value: 'villa', label: 'Detached Villa', backendCode: 'VILLA_DETACHED' },
  { value: 'villa_semi', label: 'Semi-Detached Villa', backendCode: 'VILLA_SEMI_DETACHED' },
  { value: 'bungalow', label: 'Bungalow', backendCode: 'BUNGALOW' },
  { value: 'duplex', label: 'Duplex', backendCode: 'DUPLEX' },
  { value: 'triplex', label: 'Triplex', backendCode: 'TRIPLEX' },
  { value: 'studio', label: 'Studio', backendCode: 'STUDIO' },
  { value: 'townhouse', label: 'Townhouse', backendCode: 'TOWNHOUSE' },
  // Commercial
  { value: 'office', label: 'Office', backendCode: 'OFFICE' },
  { value: 'retail', label: 'Retail Space', backendCode: 'RETAIL' },
  { value: 'warehouse', label: 'Warehouse', backendCode: 'WAREHOUSE' },
  { value: 'hotel', label: 'Hotel', backendCode: 'HOTEL' },
  // Land
  { value: 'land_residential', label: 'Residential Land', backendCode: 'LAND_RESIDENTIAL' },
  { value: 'land_commercial', label: 'Commercial Land', backendCode: 'LAND_COMMERCIAL' },
  { value: 'land_agricultural', label: 'Agricultural Land', backendCode: 'LAND_AGRICULTURAL' },
];

const FURNISHED_STATUS_OPTIONS = [
  { value: 'NOT_SPECIFIED', label: 'Not Specified' },
  { value: 'UNFURNISHED', label: 'Unfurnished' },
  { value: 'PARTLY_FURNISHED', label: 'Partly Furnished' },
  { value: 'FULLY_FURNISHED', label: 'Fully Furnished' },
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
  const [livingRooms, setLivingRooms] = useState<number>(1);
  const [yearBuilt, setYearBuilt] = useState<string>('');
  const [parkingSpaces, setParkingSpaces] = useState<string>('');

  // Property Details
  const [buildingName, setBuildingName] = useState<string>('');
  const [flatNumber, setFlatNumber] = useState<string>('');
  const [floorNumber, setFloorNumber] = useState<string>('');
  const [totalAreaSqm, setTotalAreaSqm] = useState<string>('');
  const [netAreaSqm, setNetAreaSqm] = useState<string>('');
  const [roomConfig, setRoomConfig] = useState<string>(''); // e.g., "2+1"
  const [isGatedCommunity, setIsGatedCommunity] = useState<boolean>(false);

  // Features - Changed furnished from boolean to enum
  const [furnishedStatus, setFurnishedStatus] = useState<string>('NOT_SPECIFIED');
  const [petFriendly, setPetFriendly] = useState<boolean | null>(null);
  const [hasPool, setHasPool] = useState<boolean>(false);
  const [hasGym, setHasGym] = useState<boolean>(false);
  const [hasSeaView, setHasSeaView] = useState<boolean>(false);
  const [hasParkingAmenity, setHasParkingAmenity] = useState<boolean>(false);

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
    setLivingRooms(1);
    setYearBuilt('');
    setParkingSpaces('');
    setBuildingName('');
    setFlatNumber('');
    setFloorNumber('');
    setTotalAreaSqm('');
    setNetAreaSqm('');
    setRoomConfig('');
    setIsGatedCommunity(false);
    setFurnishedStatus('NOT_SPECIFIED');
    setPetFriendly(null);
    setHasPool(false);
    setHasGym(false);
    setHasSeaView(false);
    setHasParkingAmenity(false);
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
    // Try to match by value first, then by slug
    const match = subs.find((s) =>
      s.slug === propertyType ||
      s.slug.replace('-', '_') === propertyType ||
      s.slug.toLowerCase() === propertyType.toLowerCase()
    );
    return match?.id;
  };

  const getPropertyTypeBackendCode = (): string => {
    const typeObj = PROPERTY_TYPES.find(pt => pt.value === propertyType);
    return typeObj?.backendCode || 'APARTMENT';
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

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');

      // Determine base price and transaction type for backend
      let basePrice: number | null = null;
      let transactionType: 'rent_long' | 'rent_short' | 'sale' = 'rent_long';

      if (isForSale) {
        basePrice = Number(salePrice || 0);
        transactionType = 'sale';
      } else {
        if (rentType === 'short_term') {
          basePrice = Number(nightlyPrice || 0);
          transactionType = 'rent_short';
        } else {
          basePrice = Number(monthlyPrice || 0);
          transactionType = 'rent_long';
        }
      }

      const featureCodes: string[] = [];
      if (hasPool) featureCodes.push('pool_shared');
      if (hasGym) featureCodes.push('gym');
      if (hasSeaView) featureCodes.push('sea_view');
      if (hasParkingAmenity) featureCodes.push('open_parking');

      const payload: any = {
        title,
        description,
        ad_number: adNumber || undefined,
        location: {
          city,
          district: district || undefined,
          latitude: lat ? Number(lat) : undefined,
          longitude: lng ? Number(lng) : undefined,
        },
        structure: {
          property_type_code: getPropertyTypeBackendCode(),
          bedrooms,
          living_rooms: livingRooms,
          bathrooms,
          room_configuration_label: roomConfig || undefined,
          building_name: buildingName || undefined,
          flat_number: flatNumber || undefined,
          floor_number: floorNumber ? Number(floorNumber) : undefined,
          total_area_sqm: totalAreaSqm ? Number(totalAreaSqm) : undefined,
          net_area_sqm: netAreaSqm ? Number(netAreaSqm) : undefined,
          year_built: yearBuilt ? Number(yearBuilt) : undefined,
          parking_spaces: parkingSpaces ? Number(parkingSpaces) : undefined,
          is_gated_community: isGatedCommunity,
          furnished_status:
            furnishedStatus && furnishedStatus !== 'NOT_SPECIFIED' ? furnishedStatus : undefined,
        },
        features: {
          feature_codes: featureCodes,
          pet_friendly: petFriendly !== null ? petFriendly : undefined,
        },
        listing: {
          transaction_type: transactionType,
          base_price: basePrice !== null && isFinite(basePrice) ? basePrice : null,
          currency,
          rental_kind: !isForSale
            ? (rentType === 'short_term' ? 'DAILY' : 'LONG_TERM')
            : undefined,
          min_term_months:
            !isForSale && minTermMonths ? Number(minTermMonths) : undefined,
          available_from: !isForSale && availableFrom ? availableFrom : undefined,
          deposit: !isForSale && deposit ? Number(deposit) : undefined,
          min_nights: !isForSale && minNights ? Number(minNights) : undefined,
        },
      };

      const createResp = await axios.post(
        `${config.API_BASE_URL}/api/v1/real_estate/properties/`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const listingId: string = createResp.data?.listing_id;

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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Spacious 2BR Apartment in Kyrenia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the property..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
                        <optgroup label="Residential">
                          {PROPERTY_TYPES.filter((_, i) => i < 9).map((pt) => (
                            <SelectItem key={pt.value} value={pt.value}>
                              {pt.label}
                            </SelectItem>
                          ))}
                        </optgroup>
                        <optgroup label="Commercial">
                          {PROPERTY_TYPES.filter((_, i) => i >= 9 && i < 13).map((pt) => (
                            <SelectItem key={pt.value} value={pt.value}>
                              {pt.label}
                            </SelectItem>
                          ))}
                        </optgroup>
                        <optgroup label="Land">
                          {PROPERTY_TYPES.filter((_, i) => i >= 13).map((pt) => (
                            <SelectItem key={pt.value} value={pt.value}>
                              {pt.label}
                            </SelectItem>
                          ))}
                        </optgroup>
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
                    <Label>Living Rooms</Label>
                    <Input
                      type="number"
                      min={0}
                      value={livingRooms}
                      onChange={(e) => setLivingRooms(Number(e.target.value || 1))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room-config">Room Config (e.g., 2+1)</Label>
                    <Input
                      id="room-config"
                      value={roomConfig}
                      onChange={(e) => setRoomConfig(e.target.value)}
                      placeholder="2+1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="building-name">Building Name</Label>
                    <Input
                      id="building-name"
                      value={buildingName}
                      onChange={(e) => setBuildingName(e.target.value)}
                      placeholder="Royal Heights"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flat-number">Flat/Unit Number</Label>
                    <Input
                      id="flat-number"
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      placeholder="A-101"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="floor-number">Floor Number</Label>
                    <Input
                      id="floor-number"
                      type="number"
                      min={-1}
                      value={floorNumber}
                      onChange={(e) => setFloorNumber(e.target.value)}
                      placeholder="3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total-area">Total Area (sqm)</Label>
                    <Input
                      id="total-area"
                      type="number"
                      min={0}
                      value={totalAreaSqm}
                      onChange={(e) => setTotalAreaSqm(e.target.value)}
                      placeholder="120"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="net-area">Net Area (sqm)</Label>
                    <Input
                      id="net-area"
                      type="number"
                      min={0}
                      value={netAreaSqm}
                      onChange={(e) => setNetAreaSqm(e.target.value)}
                      placeholder="100"
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

                  <div className="space-y-2">
                    <Label>Furnished Status</Label>
                    <Select value={furnishedStatus} onValueChange={(v) => setFurnishedStatus(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {FURNISHED_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="gated-community"
                      checked={isGatedCommunity}
                      onCheckedChange={setIsGatedCommunity}
                    />
                    <Label htmlFor="gated-community" className="cursor-pointer">
                      Gated Community
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

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has-pool"
                      checked={hasPool}
                      onCheckedChange={setHasPool}
                    />
                    <Label htmlFor="has-pool" className="cursor-pointer">
                      Pool
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has-gym"
                      checked={hasGym}
                      onCheckedChange={setHasGym}
                    />
                    <Label htmlFor="has-gym" className="cursor-pointer">
                      Gym
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has-sea-view"
                      checked={hasSeaView}
                      onCheckedChange={setHasSeaView}
                    />
                    <Label htmlFor="has-sea-view" className="cursor-pointer">
                      Sea View
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has-parking-amenity"
                      checked={hasParkingAmenity}
                      onCheckedChange={setHasParkingAmenity}
                    />
                    <Label htmlFor="has-parking-amenity" className="cursor-pointer">
                      Dedicated Parking
                    </Label>
                  </div>
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
