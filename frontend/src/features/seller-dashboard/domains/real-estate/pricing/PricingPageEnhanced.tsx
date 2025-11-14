/**
 * Enhanced Pricing & Promotions section
 * - Dynamic pricing suggestions
 * - Promo code management
 * - Competitive analysis
 * - Price history charts
 * - A/B testing for pricing
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Tag,
  DollarSign,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// Mock data for price history
const mockPriceHistory = [
  { month: 'Jan', actual: 1200, suggested: 1150, market_avg: 1180 },
  { month: 'Feb', actual: 1200, suggested: 1280, market_avg: 1200 },
  { month: 'Mar', actual: 1250, suggested: 1320, market_avg: 1250 },
  { month: 'Apr', actual: 1300, suggested: 1400, market_avg: 1320 },
  { month: 'May', actual: 1350, suggested: 1450, market_avg: 1380 },
  { month: 'Jun', actual: 1400, suggested: 1500, market_avg: 1420 },
];

// Mock promo codes
const mockPromoCodes = [
  {
    id: '1',
    code: 'SUMMER25',
    discount: 25,
    type: 'percentage',
    status: 'active',
    uses: 12,
    max_uses: 50,
    start_date: '2024-06-01',
    end_date: '2024-08-31',
  },
  {
    id: '2',
    code: 'EARLYBIRD',
    discount: 100,
    type: 'fixed',
    status: 'active',
    uses: 8,
    max_uses: 20,
    start_date: '2024-05-01',
    end_date: '2024-07-31',
  },
  {
    id: '3',
    code: 'WINTER20',
    discount: 20,
    type: 'percentage',
    status: 'expired',
    uses: 45,
    max_uses: 50,
    start_date: '2023-12-01',
    end_date: '2024-02-28',
  },
];

// Mock competitive pricing data
const mockCompetitors = [
  { property: 'Seaside Apartment 2B (Yours)', price: 1400, occupancy: 85, revenue: 35700 },
  { property: 'Ocean View Villa', price: 1550, occupancy: 78, revenue: 36270 },
  { property: 'Beach House Studio', price: 1200, occupancy: 92, revenue: 33120 },
  { property: 'Coastal Retreat', price: 1650, occupancy: 70, revenue: 34650 },
  { property: 'Sunset Penthouse', price: 1800, occupancy: 65, revenue: 35100 },
];

// Mock pricing suggestions
const mockSuggestions = [
  {
    property: 'Seaside Apartment 2B',
    current: 1400,
    suggested: 1500,
    reason: 'High demand detected for your area. Increase by 7% to maximize revenue.',
    impact: '+EUR 3,000/month',
    confidence: 92,
  },
  {
    property: 'Downtown Villa',
    current: 2500,
    suggested: 2300,
    reason: 'Low occupancy (45%). Reduce by 8% to attract more bookings.',
    impact: '+EUR 1,500/month (via occupancy)',
    confidence: 88,
  },
];

export const PricingPageEnhanced = () => {
  const [createPromoOpen, setCreatePromoOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<any>(null);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    max_uses: '',
    start_date: '',
    end_date: '',
  });

  const activePromos = mockPromoCodes.filter((p) => p.status === 'active');
  const totalDiscountGiven = mockPromoCodes.reduce((sum, p) => sum + p.uses * p.discount, 0);

  const handleCreatePromo = () => {
    // TODO: Call API to create promo code
    console.log('Create promo:', newPromo);
    setCreatePromoOpen(false);
    setNewPromo({ code: '', discount: '', type: 'percentage', max_uses: '', start_date: '', end_date: '' });
  };

  const handleDeletePromo = (id: string) => {
    // TODO: Call API to delete promo
    console.log('Delete promo:', id);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Pricing & Promotions
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Optimize pricing and manage promotional campaigns</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promos</CardTitle>
            <Tag className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{activePromos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {mockPromoCodes.reduce((sum, p) => sum + p.uses, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All-time redemptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discount Given</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">EUR {totalDiscountGiven.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total discounts applied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">EUR 1,325</div>
            <p className="text-xs text-muted-foreground mt-1">Across all properties</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions">
            <TrendingUp className="h-4 w-4 mr-2" />
            Price Suggestions
          </TabsTrigger>
          <TabsTrigger value="history">
            <BarChart3 className="h-4 w-4 mr-2" />
            Price History
          </TabsTrigger>
          <TabsTrigger value="promos">
            <Tag className="h-4 w-4 mr-2" />
            Promo Codes
          </TabsTrigger>
          <TabsTrigger value="competitive">
            <DollarSign className="h-4 w-4 mr-2" />
            Competitive Analysis
          </TabsTrigger>
        </TabsList>

        {/* Price Suggestions Tab */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Pricing Suggestions</CardTitle>
              <CardDescription>Recommendations based on demand, occupancy, and market trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{suggestion.property}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-slate-100 text-slate-800">
                            Current: EUR {suggestion.current}
                          </Badge>
                          <span className="text-xl">→</span>
                          <Badge className="bg-green-100 text-green-800">
                            Suggested: EUR {suggestion.suggested}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                        <Badge className="bg-blue-100 text-blue-800">{suggestion.confidence}%</Badge>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded border border-slate-200 mb-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium mb-1">Why this suggestion?</p>
                          <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {suggestion.suggested > suggestion.current ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-amber-600" />
                        )}
                        <span className="font-semibold text-green-600">{suggestion.impact}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Reject
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Apply Suggestion
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Price History & Trends</CardTitle>
              <CardDescription>Track your pricing changes vs. market averages and suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={mockPriceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[1000, 1600]} label={{ value: 'Price (EUR)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => `EUR ${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Your Price" />
                  <Line type="monotone" dataKey="suggested" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="AI Suggestion" />
                  <Line type="monotone" dataKey="market_avg" stroke="#94a3b8" strokeWidth={2} name="Market Average" />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-semibold text-green-900">Your Price</span>
                  </div>
                  <p className="text-sm text-green-700">Current pricing strategy</p>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="font-semibold text-blue-900">AI Suggestion</span>
                  </div>
                  <p className="text-sm text-blue-700">Optimized for revenue</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                    <span className="font-semibold text-slate-900">Market Average</span>
                  </div>
                  <p className="text-sm text-slate-700">Similar properties</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promo Codes Tab */}
        <TabsContent value="promos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Promotional Codes</CardTitle>
                  <CardDescription>Create and manage discount codes for customers</CardDescription>
                </div>
                <Button onClick={() => setCreatePromoOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Promo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Valid Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPromoCodes.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell className="font-mono font-semibold">{promo.code}</TableCell>
                        <TableCell>
                          {promo.type === 'percentage' ? `${promo.discount}%` : `EUR ${promo.discount}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{promo.uses} / {promo.max_uses}</span>
                            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{ width: `${(promo.uses / promo.max_uses) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(promo.start_date).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              to {new Date(promo.end_date).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              promo.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-800'
                            }
                          >
                            {promo.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditPromo(promo)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeletePromo(promo.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Analysis Tab */}
        <TabsContent value="competitive">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Pricing Analysis</CardTitle>
              <CardDescription>Compare your pricing with similar properties in the area</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={mockCompetitors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="property" angle={-15} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" label={{ value: 'Price (EUR)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Occupancy %', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="price" fill="#10b981" name="Price (EUR)" />
                  <Bar yAxisId="right" dataKey="occupancy" fill="#3b82f6" name="Occupancy %" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Price/Month</TableHead>
                      <TableHead className="text-right">Occupancy</TableHead>
                      <TableHead className="text-right">Est. Revenue</TableHead>
                      <TableHead>Positioning</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCompetitors.map((comp, idx) => {
                      const isYours = comp.property.includes('(Yours)');
                      return (
                        <TableRow key={idx} className={isYours ? 'bg-blue-50 font-semibold' : ''}>
                          <TableCell>{comp.property}</TableCell>
                          <TableCell className="text-right">EUR {comp.price.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{comp.occupancy}%</TableCell>
                          <TableCell className="text-right">EUR {comp.revenue.toLocaleString()}</TableCell>
                          <TableCell>
                            {isYours ? (
                              <Badge className="bg-blue-100 text-blue-800">Your Property</Badge>
                            ) : comp.price < 1400 ? (
                              <Badge className="bg-green-100 text-green-800">Lower Price</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800">Higher Price</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Promo Dialog */}
      <Dialog open={createPromoOpen} onOpenChange={setCreatePromoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Promotional Code</DialogTitle>
            <DialogDescription>Set up a new discount code for customers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Promo Code</Label>
              <Input
                placeholder="e.g., SUMMER25"
                value={newPromo.code}
                onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                className="uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  value={newPromo.type}
                  onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (EUR)</option>
                </select>
              </div>

              <div>
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  placeholder={newPromo.type === 'percentage' ? '25' : '100'}
                  value={newPromo.discount}
                  onChange={(e) => setNewPromo({ ...newPromo, discount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Maximum Uses</Label>
              <Input
                type="number"
                placeholder="50"
                value={newPromo.max_uses}
                onChange={(e) => setNewPromo({ ...newPromo, max_uses: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newPromo.start_date}
                  onChange={(e) => setNewPromo({ ...newPromo, start_date: e.target.value })}
                />
              </div>

              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newPromo.end_date}
                  onChange={(e) => setNewPromo({ ...newPromo, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setCreatePromoOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePromo}>Create Promo Code</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingPageEnhanced;
