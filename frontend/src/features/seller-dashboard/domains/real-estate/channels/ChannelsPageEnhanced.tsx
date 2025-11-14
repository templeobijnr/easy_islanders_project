/**
 * Enhanced Channels & Distribution section
 * - Performance by platform (Airbnb, Booking.com, Direct)
 * - Conversion rates per channel
 * - Revenue comparison charts
 * - Syndication status tracking
 * - Platform optimization recommendations
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock channel data
const mockChannels = [
  {
    id: '1',
    name: 'Airbnb',
    icon: '🏠',
    enabled: true,
    listings: 8,
    bookings: 45,
    revenue: 18900,
    conversion: 12.5,
    commission: 15,
    avg_booking_value: 420,
    status: 'connected',
  },
  {
    id: '2',
    name: 'Booking.com',
    icon: '🌐',
    enabled: true,
    listings: 8,
    bookings: 32,
    revenue: 14400,
    conversion: 9.8,
    commission: 18,
    avg_booking_value: 450,
    status: 'connected',
  },
  {
    id: '3',
    name: 'Direct Website',
    icon: '💻',
    enabled: true,
    listings: 8,
    bookings: 18,
    revenue: 9000,
    conversion: 15.2,
    commission: 0,
    avg_booking_value: 500,
    status: 'active',
  },
  {
    id: '4',
    name: 'Vrbo',
    icon: '🏡',
    enabled: false,
    listings: 0,
    bookings: 0,
    revenue: 0,
    conversion: 0,
    commission: 12,
    avg_booking_value: 0,
    status: 'disconnected',
  },
  {
    id: '5',
    name: 'Expedia',
    icon: '✈️',
    enabled: true,
    listings: 5,
    bookings: 12,
    revenue: 5400,
    conversion: 7.2,
    commission: 20,
    avg_booking_value: 450,
    status: 'syncing',
  },
];

// Revenue by channel chart data
const revenueChartData = mockChannels
  .filter((c) => c.enabled && c.revenue > 0)
  .map((c) => ({
    name: c.name,
    revenue: c.revenue,
    bookings: c.bookings,
  }));

// Pie chart colors
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

// Mock property syndication status
const mockPropertySyndication = [
  {
    property: 'Seaside Apartment 2B',
    airbnb: true,
    booking: true,
    direct: true,
    vrbo: false,
    expedia: true,
  },
  {
    property: 'Downtown Villa',
    airbnb: true,
    booking: true,
    direct: true,
    vrbo: false,
    expedia: false,
  },
  {
    property: 'Beach House Studio',
    airbnb: true,
    booking: false,
    direct: true,
    vrbo: false,
    expedia: true,
  },
];

export const ChannelsPageEnhanced = () => {
  const [channels, setChannels] = useState(mockChannels);

  const enabledChannels = channels.filter((c) => c.enabled);
  const totalRevenue = enabledChannels.reduce((sum, c) => sum + c.revenue, 0);
  const totalBookings = enabledChannels.reduce((sum, c) => sum + c.bookings, 0);
  const avgConversion = enabledChannels.length > 0
    ? enabledChannels.reduce((sum, c) => sum + c.conversion, 0) / enabledChannels.length
    : 0;

  const handleToggleChannel = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Connected</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800"><Activity className="h-3 w-3 mr-1" /> Syncing</Badge>;
      case 'disconnected':
        return <Badge className="bg-slate-100 text-slate-800"><XCircle className="h-3 w-3 mr-1" /> Disconnected</Badge>;
      case 'active':
        return <Badge className="bg-purple-100 text-purple-800"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Channels & Distribution
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Manage booking platforms and track performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{enabledChannels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Connected platforms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">EUR {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All channels combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all platforms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{avgConversion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Inquiry to booking</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Globe className="h-4 w-4 mr-2" />
            Channel Overview
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="syndication">
            <Activity className="h-4 w-4 mr-2" />
            Syndication Status
          </TabsTrigger>
        </TabsList>

        {/* Channel Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Platform Connections</CardTitle>
              <CardDescription>Manage your listing distribution channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`p-4 rounded-lg border ${
                      channel.enabled ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{channel.icon}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{channel.name}</h3>
                          {getStatusBadge(channel.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Label htmlFor={`channel-${channel.id}`} className="text-sm text-muted-foreground">
                          {channel.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          id={`channel-${channel.id}`}
                          checked={channel.enabled}
                          onCheckedChange={() => handleToggleChannel(channel.id)}
                        />
                      </div>
                    </div>

                    {channel.enabled && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-200">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Listings</div>
                          <div className="font-semibold">{channel.listings}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Bookings</div>
                          <div className="font-semibold">{channel.bookings}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                          <div className="font-semibold">EUR {channel.revenue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Conversion</div>
                          <div className="font-semibold">{channel.conversion}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Commission</div>
                          <div className="font-semibold">{channel.commission}%</div>
                        </div>
                      </div>
                    )}

                    {!channel.enabled && channel.status === 'disconnected' && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Connect {channel.name}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Channel */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Channel</CardTitle>
                <CardDescription>Compare earnings across platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `EUR ${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue (EUR)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Distribution Pie */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Percentage breakdown by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${((entry.revenue / totalRevenue) * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {revenueChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `EUR ${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Performance Table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Detailed Performance Metrics</CardTitle>
                <CardDescription>In-depth analysis by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Avg. Value</TableHead>
                        <TableHead className="text-right">Conversion</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Net Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enabledChannels
                        .filter((c) => c.revenue > 0)
                        .sort((a, b) => b.revenue - a.revenue)
                        .map((channel) => {
                          const commissionAmount = channel.revenue * (channel.commission / 100);
                          const netRevenue = channel.revenue - commissionAmount;

                          return (
                            <TableRow key={channel.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{channel.icon}</span>
                                  <span className="font-medium">{channel.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{channel.bookings}</TableCell>
                              <TableCell className="text-right">EUR {channel.revenue.toLocaleString()}</TableCell>
                              <TableCell className="text-right">EUR {channel.avg_booking_value}</TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  className={
                                    channel.conversion >= 12
                                      ? 'bg-green-100 text-green-800'
                                      : channel.conversion >= 8
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }
                                >
                                  {channel.conversion}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{channel.commission}%</TableCell>
                              <TableCell className="text-right font-semibold">
                                EUR {netRevenue.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Channel Optimization Recommendations</CardTitle>
                <CardDescription>AI-powered suggestions to maximize distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-blue-900 mb-1">Connect Vrbo</h4>
                        <p className="text-xs text-blue-700">
                          Vrbo has lower commission (12%) than Booking.com (18%). Based on your property type,
                          we estimate +EUR 2,000/month by adding this channel.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-green-900 mb-1">Boost Direct Bookings</h4>
                        <p className="text-xs text-green-700">
                          Direct bookings have 15.2% conversion (highest!) and 0% commission. Consider
                          offering 5% discount for direct bookings to increase this channel.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-amber-900 mb-1">Expedia Underperforming</h4>
                        <p className="text-xs text-amber-700">
                          Expedia has 7.2% conversion (lowest) and 20% commission (highest). Consider
                          adjusting pricing or improving listing quality on this platform.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Syndication Status Tab */}
        <TabsContent value="syndication">
          <Card>
            <CardHeader>
              <CardTitle>Property Syndication Matrix</CardTitle>
              <CardDescription>Track which properties are listed on which platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      {channels.map((channel) => (
                        <TableHead key={channel.id} className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xl mb-1">{channel.icon}</span>
                            <span className="text-xs">{channel.name}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPropertySyndication.map((prop, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{prop.property}</TableCell>
                        <TableCell className="text-center">
                          {prop.airbnb ? (
                            <CheckCircle className="h-5 w-5 text-green-600 inline" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-300 inline" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {prop.booking ? (
                            <CheckCircle className="h-5 w-5 text-green-600 inline" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-300 inline" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {prop.direct ? (
                            <CheckCircle className="h-5 w-5 text-green-600 inline" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-300 inline" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {prop.vrbo ? (
                            <CheckCircle className="h-5 w-5 text-green-600 inline" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-300 inline" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {prop.expedia ? (
                            <CheckCircle className="h-5 w-5 text-green-600 inline" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-300 inline" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Listed on platform</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-slate-300" />
                    <span className="text-sm text-muted-foreground">Not listed</span>
                  </div>
                  <Button size="sm">Sync All Properties</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChannelsPageEnhanced;
