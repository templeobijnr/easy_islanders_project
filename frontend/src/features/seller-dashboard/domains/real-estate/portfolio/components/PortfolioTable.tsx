import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

const PortfolioTable: React.FC = () => {
  const [filter, setFilter] = useState('all');

  const properties = [
    {
      id: 1,
      name: 'Sea View Apartment A12',
      code: 'KYR-A12',
      type: 'Apartment',
      status: 'occupied',
      purpose: 'Short-term',
      nightlyRate: '€120',
      monthlyRate: '€2,800',
      occupancy: 88,
      city: 'Kyrenia',
    },
    {
      id: 2,
      name: 'Villa Sunset Dreams',
      code: 'FAM-V03',
      type: 'Villa',
      status: 'vacant',
      purpose: 'Short-term',
      nightlyRate: '€280',
      monthlyRate: '€6,500',
      occupancy: 65,
      city: 'Famagusta',
    },
    {
      id: 3,
      name: 'Downtown Studio 5B',
      code: 'NIC-S5B',
      type: 'Studio',
      status: 'occupied',
      purpose: 'Long-term',
      nightlyRate: '-',
      monthlyRate: '€850',
      occupancy: 100,
      city: 'Nicosia',
    },
    {
      id: 4,
      name: 'Garden House',
      code: 'GIR-H22',
      type: 'House',
      status: 'under_maintenance',
      purpose: 'Short-term',
      nightlyRate: '€180',
      monthlyRate: '€4,200',
      occupancy: 0,
      city: 'Girne',
    },
    {
      id: 5,
      name: 'Penthouse Luxury',
      code: 'KYR-PH1',
      type: 'Apartment',
      status: 'under_offer',
      purpose: 'For Sale',
      nightlyRate: '-',
      monthlyRate: '-',
      occupancy: 0,
      city: 'Kyrenia',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      occupied: { variant: 'default', label: 'Occupied' },
      vacant: { variant: 'secondary', label: 'Vacant' },
      under_maintenance: { variant: 'outline', label: 'Maintenance' },
      under_offer: { variant: 'default', label: 'Under Offer' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Property Portfolio</CardTitle>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Nightly Rate</TableHead>
                <TableHead>Monthly Rate</TableHead>
                <TableHead>Occupancy (30d)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-xs text-muted-foreground">{property.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>{property.type}</TableCell>
                  <TableCell>{getStatusBadge(property.status)}</TableCell>
                  <TableCell>{property.purpose}</TableCell>
                  <TableCell>{property.nightlyRate}</TableCell>
                  <TableCell>{property.monthlyRate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            property.occupancy > 80
                              ? 'bg-green-500'
                              : property.occupancy > 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${property.occupancy}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{property.occupancy}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioTable;
