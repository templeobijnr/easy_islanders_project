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
import { Checkbox } from '@/components/ui/checkbox';
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

type FeatureOption = {
  code: string;
  label: string;
};

const BEDROOM_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const LIVING_ROOM_OPTIONS = [0, 1, 2, 3];
const BATHROOM_OPTIONS = [0, 1, 2, 3, 4, 5];

const FLOOR_NUMBER_OPTIONS = [
  { value: '-1', label: 'Basement (-1)' },
  { value: '0', label: 'Ground Floor' },
  { value: '1', label: '1st Floor' },
  { value: '2', label: '2nd Floor' },
  { value: '3', label: '3rd Floor' },
  { value: '4', label: '4th Floor' },
  { value: '5', label: '5th Floor' },
  { value: '6', label: '6th Floor' },
  { value: '7', label: '7th Floor' },
  { value: '8', label: '8th Floor' },
  { value: '9', label: '9th Floor' },
  { value: '10', label: '10th Floor' },
];

const LISTING_TYPE_OPTIONS = [
  { value: 'rent_long', label: 'Long-term Rent' },
  { value: 'rent_short', label: 'Short-term / Daily Rent' },
  { value: 'sale', label: 'Sale' },
  { value: 'project', label: 'Project Sale' },
];

const INSIDE_FEATURES: FeatureOption[] = [
  { code: 'BALCONY', label: 'Balcony' },
  { code: 'MASTER_CABINET', label: 'Master Cabinet' },
  { code: 'ENSUITE_BATHROOM', label: 'En-suite Bathroom' },
  { code: 'LAUNDRY_ROOM', label: 'Laundry Room' },
  { code: 'FIREPLACE', label: 'Fireplace' },
  { code: 'AIR_CONDITION', label: 'Air Condition' },
  { code: 'WALK_IN_CLOSET', label: 'Walk-in Closet' },
];

const OUTSIDE_FEATURES: FeatureOption[] = [
  { code: 'PRIVATE_POOL', label: 'Private Pool' },
  { code: 'SHARED_POOL', label: 'Shared Pool' },
  { code: 'PUBLIC_POOL', label: 'Public Pool' },
  { code: 'GARDEN', label: 'Garden' },
  { code: 'CLOSED_PARK', label: 'Closed Park' },
  { code: 'CAR_PARK', label: 'Car Park' },
  { code: 'ELEVATOR', label: 'Elevator' },
  { code: 'BBQ', label: 'Barbecue' },
  { code: 'TERRACE', label: 'Terrace' },
  { code: 'SECURITY_CAM', label: 'Security Cam' },
  { code: 'GENERATOR', label: 'Generator' },
];

const LOCATION_FEATURES: FeatureOption[] = [
  { code: 'SEA_VIEW', label: 'Sea View' },
  { code: 'MOUNTAIN_VIEW', label: 'Mountain View' },
  { code: 'CITY_VIEW', label: 'City View' },
  { code: 'GARDEN_VIEW', label: 'Nature / Green View' },
  { code: 'POOL_VIEW', label: 'Pool View' },
];

const TITLE_DEED_OPTIONS = [
  { value: 'TURKISH', label: 'Turkish Title Deed' },
  { value: 'EXCHANGE', label: 'Exchange Title Deed' },
  { value: 'KOCAN', label: 'Koçan (Long-term Lease)' },
  { value: 'TRNC', label: 'TRNC Title Deed' },
  { value: 'BRITISH', label: 'British Title Deed' },
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
  const [selectedFeatureCodes, setSelectedFeatureCodes] = useState<string[]>([]);

  // Listing-level extras
  const [titleDeedTypeCode, setTitleDeedTypeCode] = useState<string>('');
  const [isSwapPossible, setIsSwapPossible] = useState<boolean>(false);

  // Location
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  // Listing Type / Transaction classifier (rent_long | rent_short | sale | project)
  const [listingType, setListingType] = useState<'rent_long' | 'rent_short' | 'sale' | 'project'>('rent_long');

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
    setSelectedFeatureCodes([]);
    setTitleDeedTypeCode('');
    setIsSwapPossible(false);
    setCity('');
    setDistrict('');
    setLat('');
    setLng('');
    setListingType('rent_long');
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

  const toggleFeatureCode = (code: string) => {
    setSelectedFeatureCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const isFeatureSelected = (code: string) => selectedFeatureCodes.includes(code);

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

      // Determine base price and transaction type for backend based on listingType
      let basePrice: number | null = null;
      let transactionType: 'rent_long' | 'rent_short' | 'sale' = 'rent_long';

      if (listingType === 'rent_short') {
        transactionType = 'rent_short';
        basePrice = Number(nightlyPrice || 0);
      } else if (listingType === 'rent_long') {
        transactionType = 'rent_long';
        basePrice = Number(monthlyPrice || 0);
      } else {
        // sale or project
        transactionType = 'sale';
        basePrice = Number(salePrice || 0);
      }

      const featureCodes: string[] = selectedFeatureCodes;

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
          title_deed_type_code: titleDeedTypeCode || undefined,
        },
        features: {
          feature_codes: featureCodes,
          pet_friendly: petFriendly !== null ? petFriendly : undefined,
        },
        listing: {
          transaction_type: transactionType,
          base_price: basePrice !== null && isFinite(basePrice) ? basePrice : null,
          currency,
          rental_kind:
            listingType === 'rent_short'
              ? 'DAILY'
              : listingType === 'rent_long'
                ? 'LONG_TERM'
                : undefined,
          min_term_months:
            listingType === 'rent_long' && minTermMonths ? Number(minTermMonths) : undefined,
          available_from:
            (listingType === 'rent_long' || listingType === 'rent_short') && availableFrom
              ? availableFrom
              : undefined,
          deposit:
            (listingType === 'rent_long' || listingType === 'rent_short') && deposit
              ? Number(deposit)
              : undefined,
          min_nights:
            listingType === 'rent_short' && minNights ? Number(minNights) : undefined,
          swap_possible:
            (listingType === 'sale' || listingType === 'project') ? isSwapPossible : undefined,
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
                    <Label>Listing Type</Label>
                    <Select
                      value={listingType}
                      onValueChange={(v) =>
                        setListingType(v as 'rent_long' | 'rent_short' | 'sale' | 'project')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select listing type" />
                      </SelectTrigger>
                      <SelectContent>
                        {LISTING_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bedrooms</Label>
                    <Select
                      value={String(bedrooms)}
                      onValueChange={(v) => setBedrooms(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bedrooms" />
                      </SelectTrigger>
                      <SelectContent>
                        {BEDROOM_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={String(opt)}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bathrooms</Label>
                    <Select
                      value={String(bathrooms)}
                      onValueChange={(v) => setBathrooms(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bathrooms" />
                      </SelectTrigger>
                      <SelectContent>
                        {BATHROOM_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={String(opt)}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Living Rooms</Label>
                    <Select
                      value={String(livingRooms)}
                      onValueChange={(v) => setLivingRooms(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select living rooms" />
                      </SelectTrigger>
                      <SelectContent>
                        {LIVING_ROOM_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={String(opt)}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select
                      value={floorNumber}
                      onValueChange={setFloorNumber}
                    >
                      <SelectTrigger id="floor-number">
                        <SelectValue placeholder="Select floor" />
                      </SelectTrigger>
                      <SelectContent>
                        {FLOOR_NUMBER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  {(listingType === 'sale' || listingType === 'project') && (
                    <div className="space-y-2">
                      <Label>Title Deed</Label>
                      <Select
                        value={titleDeedTypeCode}
                        onValueChange={setTitleDeedTypeCode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select title deed" />
                        </SelectTrigger>
                        <SelectContent>
                          {TITLE_DEED_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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

                  {(listingType === 'sale' || listingType === 'project') && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="swap-possible"
                        checked={isSwapPossible}
                        onCheckedChange={setIsSwapPossible}
                      />
                      <Label htmlFor="swap-possible" className="cursor-pointer">
                        Swap Option
                      </Label>
                    </div>
                  )}

                  <div className="md:col-span-2 space-y-2">
                    <Label>Features</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Inside</div>
                        <div className="space-y-1">
                          {INSIDE_FEATURES.map((feature) => (
                            <label key={feature.code} className="flex items-center space-x-2">
                              <Checkbox
                                checked={isFeatureSelected(feature.code)}
                                onCheckedChange={() => toggleFeatureCode(feature.code)}
                              />
                              <span className="text-sm">{feature.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Outside</div>
                        <div className="space-y-1">
                          {OUTSIDE_FEATURES.map((feature) => (
                            <label key={feature.code} className="flex items-center space-x-2">
                              <Checkbox
                                checked={isFeatureSelected(feature.code)}
                                onCheckedChange={() => toggleFeatureCode(feature.code)}
                              />
                              <span className="text-sm">{feature.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Location</div>
                        <div className="space-y-1">
                          {LOCATION_FEATURES.map((feature) => (
                            <label key={feature.code} className="flex items-center space-x-2">
                              <Checkbox
                                checked={isFeatureSelected(feature.code)}
                                onCheckedChange={() => toggleFeatureCode(feature.code)}
                              />
                              <span className="text-sm">{feature.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
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

                {(listingType === 'rent_short') && (
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

                {listingType === 'rent_long' && (
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
                      <Label htmlFor="min-term-months">Minimum Term (months)</Label>
                      <Input
                        id="min-term-months"
                        type="number"
                        min={0}
                        value={minTermMonths}
                        onChange={(e) => setMinTermMonths(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {(listingType === 'rent_long' || listingType === 'rent_short') && (
                  <>
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

                {(listingType === 'sale' || listingType === 'project') && (
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
