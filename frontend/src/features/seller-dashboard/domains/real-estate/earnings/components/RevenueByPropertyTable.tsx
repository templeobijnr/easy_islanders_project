import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const RevenueByPropertyTable: React.FC = () => {
  const properties = [
    {
      name: 'Sea View Apartment A12',
      revenue: '€8,960',
      nightsOccupied: 26,
      adr: '€145',
      revpar: '€128',
    },
    {
      name: 'Villa Sunset Dreams',
      revenue: '€6,720',
      nightsOccupied: 24,
      adr: '€280',
      revpar: '€224',
    },
    {
      name: 'Downtown Studio 5B',
      revenue: '€2,800',
      nightsOccupied: 30,
      adr: '€93',
      revpar: '€93',
    },
    {
      name: 'Garden House',
      revenue: '€4,320',
      nightsOccupied: 24,
      adr: '€180',
      revpar: '€144',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Property</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Nights Occupied</TableHead>
              <TableHead>ADR</TableHead>
              <TableHead>RevPAR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.name}>
                <TableCell className="font-medium">{property.name}</TableCell>
                <TableCell className="font-semibold">{property.revenue}</TableCell>
                <TableCell>{property.nightsOccupied}</TableCell>
                <TableCell>{property.adr}</TableCell>
                <TableCell>{property.revpar}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 p-3 bg-muted rounded text-xs space-y-1">
          <p><strong>ADR:</strong> Average Daily Rate (revenue ÷ nights occupied)</p>
          <p><strong>RevPAR:</strong> Revenue Per Available Room (revenue ÷ total nights in period)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueByPropertyTable;
