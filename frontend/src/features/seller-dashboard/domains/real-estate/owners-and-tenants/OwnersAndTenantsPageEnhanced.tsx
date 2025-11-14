/**
 * Enhanced Owners & Tenants section
 * - Contact directory
 * - Lease management
 * - Payment tracking
 * - Communication history
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Mail, Phone, Home, Calendar, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data
const mockTenants = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+357 99 123 456',
    property: 'Seaside Apartment 2B',
    leaseStart: '2024-01-01',
    leaseEnd: '2025-01-01',
    rent: 1200,
    status: 'active',
  },
  {
    id: '2',
    name: 'Maria Garcia',
    email: 'maria.g@email.com',
    phone: '+357 99 234 567',
    property: 'Downtown Villa',
    leaseStart: '2024-06-01',
    leaseEnd: '2025-06-01',
    rent: 2500,
    status: 'active',
  },
];

const mockOwners = [
  {
    id: '1',
    name: 'Property Management LLC',
    email: 'contact@propmanagement.com',
    phone: '+357 24 111 222',
    properties: 12,
    totalRevenue: 18500,
    status: 'verified',
  },
];

export const OwnersAndTenantsPageEnhanced = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const activeTenants = mockTenants.filter((t) => t.status === 'active').length;
  const totalRent = mockTenants.reduce((sum, t) => sum + t.rent, 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Owners & Tenants
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Manage contacts and relationships</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activeTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently leasing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
            <Home className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{mockOwners.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Property owners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">EUR {totalRent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Combined rent/month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Tenants and Owners */}
      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenants">
            <Users className="h-4 w-4 mr-2" />
            Tenants ({mockTenants.length})
          </TabsTrigger>
          <TabsTrigger value="owners">
            <Home className="h-4 w-4 mr-2" />
            Owners ({mockOwners.length})
          </TabsTrigger>
        </TabsList>

        {/* Tenants Tab */}
        <TabsContent value="tenants">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Directory</CardTitle>
              <CardDescription>All current and past tenants</CardDescription>
              <div className="mt-4">
                <Input
                  placeholder="Search by name, email, or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Lease Period</TableHead>
                      <TableHead className="text-right">Rent/Month</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {tenant.email}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {tenant.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{tenant.property}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(tenant.leaseStart).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              to {new Date(tenant.leaseEnd).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">EUR {tenant.rent.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{tenant.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Owners Tab */}
        <TabsContent value="owners">
          <Card>
            <CardHeader>
              <CardTitle>Owner Directory</CardTitle>
              <CardDescription>Property owners and management companies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Properties</TableHead>
                      <TableHead className="text-right">Monthly Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOwners.map((owner) => (
                      <TableRow key={owner.id}>
                        <TableCell className="font-medium">{owner.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {owner.email}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {owner.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{owner.properties}</TableCell>
                        <TableCell className="text-right">EUR {owner.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">{owner.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnersAndTenantsPageEnhanced;
