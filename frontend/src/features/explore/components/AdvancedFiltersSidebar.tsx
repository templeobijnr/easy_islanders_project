/**
 * AdvancedFiltersSidebar - Comprehensive filters with category-specific options
 * Features: Price range, location, rating, amenities, dynamic category filters
 */

import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  MapPin,
  Star,
  Home,
  Car,
  Utensils,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  Wrench,
} from 'lucide-react';
import { Category, ExploreFilters } from '../types';

interface AdvancedFiltersSidebarProps {
  category: Category | null;
  filters: ExploreFilters;
  onFiltersChange: (filters: ExploreFilters) => void;
  onReset: () => void;
  className?: string;
}

export const AdvancedFiltersSidebar: React.FC<AdvancedFiltersSidebarProps> = ({
  category,
  filters,
  onFiltersChange,
  onReset,
  className = '',
}) => {
  // Local filter state
  const [priceMin, setPriceMin] = useState(filters.priceMin || 0);
  const [priceMax, setPriceMax] = useState(filters.priceMax || 1000000);
  const [location, setLocation] = useState(filters.location || '');
  const [rating, setRating] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['price', 'location', 'rating'])
  );

  // Category-specific state
  const [bedrooms, setBedrooms] = useState<string>('any');
  const [bathrooms, setBathrooms] = useState<string>('any');
  const [propertyType, setPropertyType] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);

  // Vehicles
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [vehicleTransmission, setVehicleTransmission] = useState<string[]>([]);
  const [vehicleFuelTypes, setVehicleFuelTypes] = useState<string[]>([]);

  // Services
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [serviceAvailability, setServiceAvailability] = useState<string>('any');

  // Update local state when filters prop changes
  useEffect(() => {
    setPriceMin(filters.priceMin || 0);
    setPriceMax(filters.priceMax || 1000000);
    setLocation(filters.location || '');

    setBedrooms(filters.bedrooms || 'any');
    setBathrooms(filters.bathrooms || 'any');
    setPropertyType(filters.propertyType || []);
    setAmenities(filters.amenities || []);

    setVehicleTypes(filters.vehicleTypes || []);
    setVehicleTransmission(filters.vehicleTransmission || []);
    setVehicleFuelTypes(filters.vehicleFuelTypes || []);

    setServiceTypes(filters.serviceTypes || []);
    setServiceAvailability(filters.serviceAvailability || 'any');
  }, [filters]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Apply filters
  const handleApply = () => {
    const newFilters: ExploreFilters = {
      ...filters,
      priceMin,
      priceMax,
      location: location || undefined,
    };

    // Add category-specific filters
    if (category?.slug === 'real-estate') {
      newFilters.bedrooms = bedrooms;
      newFilters.bathrooms = bathrooms;
      newFilters.propertyType = propertyType;
      newFilters.amenities = amenities;
    }

    if (category?.slug === 'vehicles') {
      newFilters.vehicleTypes = vehicleTypes;
      newFilters.vehicleTransmission = vehicleTransmission;
      newFilters.vehicleFuelTypes = vehicleFuelTypes;
    }

    if (category?.slug === 'services') {
      newFilters.serviceTypes = serviceTypes;
      newFilters.serviceAvailability = serviceAvailability;
    }

    onFiltersChange(newFilters);
  };

  // Reset filters
  const handleReset = () => {
    setPriceMin(0);
    setPriceMax(1000000);
    setLocation('');
    setRating(0);
    setBedrooms('any');
    setBathrooms('any');
    setPropertyType([]);
    setAmenities([]);
    setVehicleTypes([]);
    setVehicleTransmission([]);
    setVehicleFuelTypes([]);
    setServiceTypes([]);
    setServiceAvailability('any');
    onReset();
  };

  // Count active filters
  const activeFilterCount = [
    priceMin > 0 || priceMax < 1000000,
    location.length > 0,
    rating > 0,
    bedrooms !== 'any',
    bathrooms !== 'any',
    propertyType.length > 0,
    amenities.length > 0,
    vehicleTypes.length > 0,
    vehicleTransmission.length > 0,
    vehicleFuelTypes.length > 0,
    serviceTypes.length > 0,
    serviceAvailability !== 'any',
  ].filter(Boolean).length;

  // Toggle amenity
  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  // Toggle property type
  const togglePropertyType = (type: string) => {
    setPropertyType((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div
      className={`w-80 h-full bg-card/80 backdrop-blur-md rounded-2xl border border-border shadow-card overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-gradient-to-r from-ocean-50/80 to-ocean-100/80">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-500 text-primary-foreground text-xs rounded-full font-semibold">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          Clear all
        </button>
      </div>

      {/* Scrollable Filter Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Price Range */}
        <FilterSection
          title="Price Range"
          icon={<DollarSign className="w-4 h-4" />}
          expanded={expandedSections.has('price')}
          onToggle={() => toggleSection('price')}
        >
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Min
                </label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-background/90 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Max
                </label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  placeholder="1,000,000"
                  className="w-full px-3 py-2 rounded-lg bg-background/90 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            {/* Price Range Slider Visual */}
            <div className="relative h-1.5 bg-neutral-200 rounded-full">
              <div
                className="absolute h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                style={{
                  left: `${(priceMin / 1000000) * 100}%`,
                  right: `${100 - (priceMax / 1000000) * 100}%`,
                }}
              />
            </div>

            {/* Quick Price Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Under €100k', max: 100000 },
                { label: '€100k-€300k', min: 100000, max: 300000 },
                { label: 'Over €500k', min: 500000 },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (preset.min !== undefined) setPriceMin(preset.min);
                    if (preset.max !== undefined) setPriceMax(preset.max);
                  }}
                  className="px-2 py-1.5 text-xs rounded-lg bg-neutral-100 hover:bg-primary/10 hover:text-primary text-muted-foreground font-medium transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </FilterSection>

        {/* Location */}
        <FilterSection
          title="Location"
          icon={<MapPin className="w-4 h-4" />}
          expanded={expandedSections.has('location')}
          onToggle={() => toggleSection('location')}
        >
          <div className="space-y-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or region..."
                className="w-full px-10 py-2.5 rounded-lg bg-background/90 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
              {location && (
                <button
                  onClick={() => setLocation('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Popular Locations */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Popular</p>
              <div className="flex flex-wrap gap-1.5">
                {['Kyrenia', 'Famagusta', 'Nicosia', 'Esentepe', 'Iskele'].map((city) => (
                  <button
                    key={city}
                    onClick={() => setLocation(city)}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                      location === city
                        ? 'bg-primary-500 text-primary-foreground'
                        : 'bg-neutral-100 hover:bg-primary/10 text-muted-foreground'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection
          title="Minimum Rating"
          icon={<Star className="w-4 h-4" />}
          expanded={expandedSections.has('rating')}
          onToggle={() => toggleSection('rating')}
        >
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-2.5 rounded-lg transition-all ${
                  rating >= star
                    ? 'bg-success-500 text-success-foreground shadow-md'
                    : 'bg-neutral-100 text-muted-foreground hover:bg-success-50 hover:text-success-700'
                }`}
              >
                <Star className={`w-5 h-5 ${rating >= star ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Show listings rated {rating}+ stars
            </p>
          )}
        </FilterSection>

        {/* Category-Specific Filters */}
        {category?.slug === 'real-estate' && (
          <>
            {/* Bedrooms */}
            <FilterSection
              title="Bedrooms"
              icon={<Home className="w-4 h-4" />}
              expanded={expandedSections.has('bedrooms')}
              onToggle={() => toggleSection('bedrooms')}
            >
              <div className="grid grid-cols-4 gap-2">
                {['Any', '1+', '2+', '3+', '4+', '5+'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setBedrooms(option.toLowerCase())}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      bedrooms === option.toLowerCase()
                        ? 'bg-primary-500 text-primary-foreground shadow-md'
                        : 'bg-neutral-100 hover:bg-primary/10 text-muted-foreground'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Property Type */}
            <FilterSection
              title="Property Type"
              icon={<Home className="w-4 h-4" />}
              expanded={expandedSections.has('property-type')}
              onToggle={() => toggleSection('property-type')}
            >
              <div className="space-y-2">
                {['Villa', 'Apartment', 'House', 'Land', 'Commercial'].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={propertyType.includes(type)}
                      onChange={() => togglePropertyType(type)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Amenities */}
            <FilterSection
              title="Amenities"
              icon={<Star className="w-4 h-4" />}
              expanded={expandedSections.has('amenities')}
              onToggle={() => toggleSection('amenities')}
            >
              <div className="space-y-2">
                {['Pool', 'Garden', 'Parking', 'Sea View', 'Furnished', 'AC'].map(
                  (amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground">
                        {amenity}
                      </span>
                    </label>
                  )
                )}
              </div>
            </FilterSection>
          </>
        )}

        {category?.slug === 'vehicles' && (
          <>
            <FilterSection
              title="Vehicle Type"
              icon={<Car className="w-4 h-4" />}
              expanded={expandedSections.has('vehicle-type')}
              onToggle={() => toggleSection('vehicle-type')}
            >
              <div className="space-y-2">
                {['Car', 'SUV', 'Motorcycle', 'Bicycle', 'Boat', 'Truck'].map((type) => {
                  const key = type.toLowerCase();
                  const checked = vehicleTypes.includes(key);
                  return (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setVehicleTypes((prev) =>
                            prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
                          )
                        }
                        className="w-4 h-4 rounded border-slate-300 text-lime-600 focus:ring-lime-600 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        {type}
                      </span>
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection
              title="Transmission"
              icon={<Car className="w-4 h-4" />}
              expanded={expandedSections.has('transmission')}
              onToggle={() => toggleSection('transmission')}
            >
              <div className="space-y-2">
                {['Automatic', 'Manual'].map((type) => {
                  const key = type.toLowerCase();
                  const checked = vehicleTransmission.includes(key);
                  return (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setVehicleTransmission((prev) =>
                            prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
                          )
                        }
                        className="w-4 h-4 rounded border-slate-300 text-lime-600 focus:ring-lime-600 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        {type}
                      </span>
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection
              title="Fuel Type"
              icon={<Car className="w-4 h-4" />}
              expanded={expandedSections.has('fuel')}
              onToggle={() => toggleSection('fuel')}
            >
              <div className="space-y-2">
                {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((type) => {
                  const key = type.toLowerCase();
                  const checked = vehicleFuelTypes.includes(key);
                  return (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setVehicleFuelTypes((prev) =>
                            prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
                          )
                        }
                        className="w-4 h-4 rounded border-slate-300 text-lime-600 focus:ring-lime-600 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        {type}
                      </span>
                    </label>
                  );
                })}
              </div>
            </FilterSection>
          </>
        )}

        {category?.slug === 'services' && (
          <>
            <FilterSection
              title="Service Type"
              icon={<Wrench className="w-4 h-4" />}
              expanded={expandedSections.has('service-type')}
              onToggle={() => toggleSection('service-type')}
            >
              <div className="space-y-2">
                {['Cleaning', 'Maintenance', 'Transportation', 'Photography', 'Tutoring', 'Digital Services'].map(
                  (type) => {
                    const key = type.toLowerCase().replace(/\s+/g, '_');
                    const checked = serviceTypes.includes(key);
                    return (
                      <label key={type} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setServiceTypes((prev) =>
                              prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
                            )
                          }
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground">
                          {type}
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            </FilterSection>

            <FilterSection
              title="Availability"
              icon={<Calendar className="w-4 h-4" />}
              expanded={expandedSections.has('service-availability')}
              onToggle={() => toggleSection('service-availability')}
            >
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Any time', value: 'any' },
                  { label: 'Today', value: 'today' },
                  { label: 'This week', value: 'week' },
                  { label: 'Weekends', value: 'weekends' },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setServiceAvailability(value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      serviceAvailability === value
                        ? 'bg-primary-500 text-primary-foreground shadow-md'
                        : 'bg-neutral-100 hover:bg-primary/10 text-muted-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FilterSection>
          </>
        )}

        {category?.slug === 'restaurants' && (
          <FilterSection
            title="Cuisine"
            icon={<Utensils className="w-4 h-4" />}
            expanded={expandedSections.has('cuisine')}
            onToggle={() => toggleSection('cuisine')}
          >
            <div className="space-y-2">
              {['Turkish', 'Mediterranean', 'International', 'Seafood', 'Vegetarian'].map(
                (cuisine) => (
                  <label
                    key={cuisine}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">
                      {cuisine}
                    </span>
                  </label>
                )
              )}
            </div>
          </FilterSection>
        )}
      </div>

      {/* Footer with Apply Button */}
      <div className="p-6 border-t border-slate-200 bg-gradient-to-r from-brand-50/60 to-cyan-50/60">
        <button
          onClick={handleApply}
          className="w-full px-6 py-3 bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

// Filter Section Component
interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  expanded,
  onToggle,
  children,
}) => {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-brand-50/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="text-brand-600">{icon}</div>
          <span className="font-semibold text-slate-900 text-sm">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-600" />
        )}
      </button>
      {expanded && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
};

export default AdvancedFiltersSidebar;
