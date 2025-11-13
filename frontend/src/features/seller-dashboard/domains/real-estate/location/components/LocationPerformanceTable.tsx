import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown } from 'lucide-react';

const LocationPerformanceTable: React.FC = () => {
  const locations = [
    {
      area: 'Kyrenia Center',
      units: 8,
      avgOccupancy: 92,
      avgPrice: '€145',
      revenueMTD: '€8,950',
      trend: 'up',
    },
    {
      area: 'Famagusta Beach',
      units: 5,
      avgOccupancy: 78,
      avgPrice: '€128',
      revenueMTD: '€5,120',
      trend: 'up',
    },
    {
      area: 'Nicosia Old Town',
      units: 4,
      avgOccupancy: 85,
      avgPrice: '€98',
      revenueMTD: '€3,420',
      trend: 'down',
    },
    {
      area: 'Girne Mountains',
      units: 3,
      avgOccupancy: 68,
      avgPrice: '€175',
      revenueMTD: '€2,980',
      trend: 'up',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area / Neighborhood</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Avg Occupancy</TableHead>
              <TableHead>Avg Price</TableHead>
              <TableHead>Revenue MTD</TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.area}>
                <TableCell className="font-medium">{location.area}</TableCell>
                <TableCell>{location.units}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{location.avgOccupancy}%</span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${location.avgOccupancy}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>{location.avgPrice}</TableCell>
                <TableCell className="font-semibold">{location.revenueMTD}</TableCell>
                <TableCell>
                  {location.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LocationPerformanceTable;
