import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

const TenantsDirectory: React.FC = () => {
  const tenants = [
    { name: 'Maria Garcia', property: 'Downtown Studio 5B', leaseEnd: '2026-03-15', rent: '€850', status: 'good' },
    { name: 'David Liu', property: 'Sea View Apartment', leaseEnd: '2025-12-20', rent: '€1,200', status: 'expiring' },
    { name: 'Emma Watson', property: 'Garden House', leaseEnd: '2026-06-01', rent: '€1,500', status: 'good' },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'expiring') {
      return <Badge variant="destructive">Expiring Soon</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-500" />
          <CardTitle>Long-term Tenants</CardTitle>
        </div>
        <CardDescription>Current long-term lease holders</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Lease End</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.name}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>{tenant.property}</TableCell>
                <TableCell>{tenant.leaseEnd}</TableCell>
                <TableCell className="font-semibold">{tenant.rent}</TableCell>
                <TableCell>{getStatusBadge(tenant.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TenantsDirectory;
