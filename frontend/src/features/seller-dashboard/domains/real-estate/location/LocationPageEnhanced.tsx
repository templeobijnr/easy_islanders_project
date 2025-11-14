/**
 * Enhanced Location Analytics section
 * - Interactive map with property markers
 * - Performance breakdown by city
 * - Revenue and occupancy comparisons
 * - Top performing locations
 */
import React, { useMemo } from 'react';
import { useRealEstateLocation } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, DollarSign, Home } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Fix for default marker icon
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Cyprus approximate coordinates for default center
const CYPRUS_CENTER = { lat: 35.1264, lng: 33.4299 };

// City coordinates (approximate)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  kyrenia: { lat: 35.3368, lng: 33.3173 },
  nicosia: { lat: 35.1856, lng: 33.3823 },
  famagusta: { lat: 35.1253, lng: 33.9502 },
  larnaca: { lat: 34.9208, lng: 33.6225 },
  limassol: { lat: 34.7071, lng: 33.0226 },
  paphos: { lat: 34.7739, lng: 32.4249 },
  'unknown': CYPRUS_CENTER,
};

export const LocationPageEnhanced = () => {
  const { data, isLoading } = useRealEstateLocation();

  if (isLoading) {
    return <div className="p-6">Loading location data...</div>;
  }

  const areas = data?.areas || [];

  // Calculate totals
  const totalUnits = areas.reduce((sum: number, area: any) => sum + (area.units || 0), 0);
  const totalRevenue = areas.reduce((sum: number, area: any) => sum + parseFloat(area.monthly_revenue || '0'), 0);

  // Find top performing areas
  const topByRevenue = [...areas]
    .sort((a: any, b: any) => parseFloat(b.monthly_revenue || '0') - parseFloat(a.monthly_revenue || '0'))
    .slice(0, 3);

  const topByOccupancy = [...areas]
    .sort((a: any, b: any) => (b.occupancy_rate || 0) - (a.occupancy_rate || 0))
    .slice(0, 3);

  // Prepare chart data
  const chartData = areas.map((area: any) => ({
    city: area.city,
    units: area.units,
    occupancy: area.occupancy_rate,
    revenue: parseFloat(area.monthly_revenue || '0'),
  }));

  // Get performance badge
  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rate >= 60) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rate >= 40) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Location Analytics
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Performance insights by area and location</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{areas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active cities/areas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">EUR {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topByRevenue[0]?.city || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              EUR {parseFloat(topByRevenue[0]?.monthly_revenue || '0').toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Map View */}
      {areas.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Property Distribution Map</CardTitle>
            <CardDescription>Visual representation of properties by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <MapContainer
                center={[CYPRUS_CENTER.lat, CYPRUS_CENTER.lng]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {areas.map((area: any, idx: number) => {
                  const cityKey = area.city.toLowerCase().replace(/\s+/g, '');
                  const coords = CITY_COORDS[cityKey] || CYPRUS_CENTER;
                  const revenue = parseFloat(area.monthly_revenue || '0');

                  return (
                    <CircleMarker
                      key={idx}
                      center={[coords.lat, coords.lng]}
                      radius={Math.max(10, Math.min(30, area.units * 3))}
                      fillColor={area.occupancy_rate >= 70 ? '#10b981' : area.occupancy_rate >= 50 ? '#f59e0b' : '#ef4444'}
                      color="#fff"
                      weight={2}
                      opacity={1}
                      fillOpacity={0.6}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-sm mb-1">{area.city}</h3>
                          <p className="text-xs">Units: {area.units}</p>
                          <p className="text-xs">Occupancy: {area.occupancy_rate.toFixed(1)}%</p>
                          <p className="text-xs">Revenue: EUR {revenue.toLocaleString()}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>High occupancy (&ge;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Medium (50-69%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Low (&lt;50%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Location</CardTitle>
              <CardDescription>Monthly revenue comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `EUR ${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue (EUR)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Occupancy by Location</CardTitle>
              <CardDescription>Occupancy rate comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="occupancy" fill="#3b82f6" name="Occupancy (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance by Location</CardTitle>
          <CardDescription>Complete breakdown of all areas</CardDescription>
        </CardHeader>
        <CardContent>
          {areas.length === 0 ? (
            <div className="text-sm text-muted-foreground">No location data available</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Occupancy %</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Monthly Revenue</TableHead>
                    <TableHead className="text-right">Revenue/Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areas.map((area: any, idx: number) => {
                    const revenue = parseFloat(area.monthly_revenue || '0');
                    const revenuePerUnit = area.units > 0 ? revenue / area.units : 0;

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{area.city}</TableCell>
                        <TableCell className="text-right">{area.units}</TableCell>
                        <TableCell className="text-right font-medium">
                          {area.occupancy_rate.toFixed(1)}%
                        </TableCell>
                        <TableCell>{getPerformanceBadge(area.occupancy_rate)}</TableCell>
                        <TableCell className="text-right">EUR {revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          EUR {revenuePerUnit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationPageEnhanced;
