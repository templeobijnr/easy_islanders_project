/**
 * PropertyLocationMap - Display-only map component for property locations
 * Shows property location with a marker and basic location info
 */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default marker icon in React-Leaflet
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  area?: string;
  address?: string;
  height?: string;
  className?: string;
}

export const PropertyLocationMap: React.FC<PropertyLocationMapProps> = ({
  latitude,
  longitude,
  city,
  area,
  address,
  height = '300px',
  className = '',
}) => {
  // Default to Kyrenia, Cyprus if no coordinates provided
  const defaultPosition = new LatLng(35.3368, 33.3173);
  const [geocodedPosition, setGeocodedPosition] = useState<LatLng | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      setGeocodedPosition(null);
      return;
    }
    const q = [address, area, city].filter(Boolean).join(', ');
    if (!q) {
      setGeocodedPosition(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
        const data = await resp.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          if (isFinite(lat) && isFinite(lon)) {
            setGeocodedPosition(new LatLng(lat, lon));
          }
        }
      } catch (_) {
        if (!cancelled) setGeocodedPosition(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, city, area, address]);

  const positionToUse = latitude && longitude
    ? new LatLng(latitude, longitude)
    : geocodedPosition || defaultPosition;

  const hasLocationData = !!(latitude && longitude) || !!geocodedPosition;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Info */}
      {(city || area || address) && (
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <MapPin className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            {city && <p className="font-medium text-slate-900">{city}</p>}
            {area && <p className="text-sm text-slate-600">{area}</p>}
            {address && <p className="text-sm text-slate-500 truncate">{address}</p>}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="border rounded-xl overflow-hidden" style={{ height }}>
        {hasLocationData ? (
          <MapContainer
            center={[positionToUse.lat, positionToUse.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
            dragging={true}
            doubleClickZoom={false}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={positionToUse} />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-50">
            <MapPin className="h-12 w-12 mb-3 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">Location not available</p>
            <p className="text-xs text-slate-500 mt-1">No coordinates provided for this property</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyLocationMap;