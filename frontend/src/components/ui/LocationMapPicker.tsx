/**
 * LocationMapPicker - Interactive map component for selecting location
 * Features:
 * - Click to drop pin and select location
 * - Reverse geocoding to get address
 * - Search bar for finding locations
 * - Auto-fill lat/lng/city/district
 */
import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from './input';
import { Button } from './button';
import { Label } from './label';
import { MapPin, Search } from 'lucide-react';

// Fix for default marker icon in React-Leaflet
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    city?: string;
    district?: string;
    address?: string;
  }) => void;
  initialPosition?: { lat: number; lng: number };
  height?: string;
}

// Component to handle map clicks
function LocationMarker({
  position,
  setPosition,
}: {
  position: LatLng | null;
  setPosition: (pos: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  onLocationSelect,
  initialPosition = { lat: 35.3368, lng: 33.3173 }, // Default: Kyrenia, Cyprus
  height = '400px',
}) => {
  const [position, setPosition] = useState<LatLng | null>(
    new LatLng(initialPosition.lat, initialPosition.lng)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      // Using Nominatim (OpenStreetMap) for free reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.address) {
        return {
          city: data.address.city || data.address.town || data.address.village || '',
          district: data.address.suburb || data.address.neighbourhood || '',
          address: data.display_name || '',
        };
      }
      return null;
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      return null;
    }
  }, []);

  // Handle position change
  const handlePositionChange = useCallback(
    async (newPosition: LatLng) => {
      setPosition(newPosition);
      setLoading(true);
      setError(null);

      try {
        const geocodedData = await reverseGeocode(newPosition.lat, newPosition.lng);

        onLocationSelect({
          lat: newPosition.lat,
          lng: newPosition.lng,
          city: geocodedData?.city || '',
          district: geocodedData?.district || '',
          address: geocodedData?.address || '',
        });
      } catch (err) {
        setError('Failed to get address for this location');
      } finally {
        setLoading(false);
      }
    },
    [onLocationSelect, reverseGeocode]
  );

  // Search for location by name
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Using Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newPosition = new LatLng(parseFloat(result.lat), parseFloat(result.lon));
        await handlePositionChange(newPosition);
      } else {
        setError('Location not found. Try a different search term.');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, handlePositionChange]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="space-y-2">
        <Label htmlFor="location-search">Search for a location</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="location-search"
              type="text"
              placeholder="Search for city, district, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            variant="outline"
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Info Text */}
      <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 text-blue-700 text-sm border border-blue-200">
        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>
          {position
            ? `Selected: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
            : 'Click on the map to select a location'}
        </span>
      </div>

      {/* Map */}
      <div className="border rounded-lg overflow-hidden" style={{ height }}>
        <MapContainer
          center={[initialPosition.lat, initialPosition.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationMapPicker;
