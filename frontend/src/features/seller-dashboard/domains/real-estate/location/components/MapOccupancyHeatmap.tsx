import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

const MapOccupancyHeatmap: React.FC = () => {
  const locations = [
    { name: 'Kyrenia', units: 12, occupancy: 92, lat: 35.3417, lng: 33.3183 },
    { name: 'Famagusta', units: 6, occupancy: 78, lat: 35.1264, lng: 33.9396 },
    { name: 'Nicosia', units: 4, occupancy: 85, lat: 35.1856, lng: 33.3823 },
    { name: 'Girne', units: 2, occupancy: 68, lat: 35.3362, lng: 33.3153 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Occupancy Heatmap</CardTitle>
        <CardDescription>Geographic distribution of your properties</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Placeholder for actual map implementation */}
        <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-lg p-8 min-h-[400px] flex items-center justify-center relative">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4" />
            <p className="font-semibold">Interactive Map Coming Soon</p>
            <p className="text-sm mt-2">Integration with mapping library pending</p>
          </div>

          {/* Location markers overlay */}
          <div className="absolute inset-0 p-4">
            {locations.map((loc, idx) => (
              <div
                key={loc.name}
                className="absolute bg-white rounded-lg shadow-lg p-3 border-2 border-primary/50"
                style={{
                  left: `${20 + idx * 20}%`,
                  top: `${30 + idx * 15}%`,
                }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">{loc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {loc.units} units • {loc.occupancy}% occupied
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapOccupancyHeatmap;
