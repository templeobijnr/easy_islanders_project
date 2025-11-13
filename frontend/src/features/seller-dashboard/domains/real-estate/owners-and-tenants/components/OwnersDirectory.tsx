import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2 } from 'lucide-react';

const OwnersDirectory: React.FC = () => {
  const owners = [
    { name: 'John Peterson', units: 5, revenue: '€42,500', nextPayout: '2025-11-20' },
    { name: 'Sarah Williams', units: 3, revenue: '€28,300', nextPayout: '2025-11-20' },
    { name: 'Ahmed Hassan', units: 4, revenue: '€35,100', nextPayout: '2025-11-25' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-500" />
          <CardTitle>Property Owners</CardTitle>
        </div>
        <CardDescription>Manage owner relationships and payouts</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Owner</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Revenue (YTD)</TableHead>
              <TableHead>Next Payout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {owners.map((owner) => (
              <TableRow key={owner.name}>
                <TableCell className="font-medium">{owner.name}</TableCell>
                <TableCell>{owner.units}</TableCell>
                <TableCell className="font-semibold">{owner.revenue}</TableCell>
                <TableCell>{owner.nextPayout}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OwnersDirectory;
