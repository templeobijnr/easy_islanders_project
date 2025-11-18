import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Filter,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
}

interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  revenue: number;
  orders: number;
  conversionRate: number;
  growth: number;
}

interface CategoryBreakdown {
  name: string;
  value: number;
  color: string;
}

const SalesAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSalesData([
        { date: 'Mon', revenue: 2840, orders: 24, customers: 18, avgOrderValue: 118.33 },
        { date: 'Tue', revenue: 3260, orders: 28, customers: 22, avgOrderValue: 116.43 },
        { date: 'Wed', revenue: 4120, orders: 35, customers: 28, avgOrderValue: 117.71 },
        { date: 'Thu', revenue: 3890, orders: 32, customers: 25, avgOrderValue: 121.56 },
        { date: 'Fri', revenue: 5240, orders: 42, customers: 35, avgOrderValue: 124.76 },
        { date: 'Sat', revenue: 6180, orders: 48, customers: 38, avgOrderValue: 128.75 },
        { date: 'Sun', revenue: 4520, orders: 38, customers: 30, avgOrderValue: 118.95 }
      ]);

      setTopProducts([
        { id: '1', name: 'Wireless Headphones Pro', category: 'Electronics', revenue: 3240, orders: 18, conversionRate: 3.2, growth: 15.4 },
        { id: '2', name: 'Smart Fitness Watch', category: 'Electronics', revenue: 2890, orders: 12, conversionRate: 2.8, growth: 8.7 },
        { id: '3', name: 'Organic Cotton T-Shirt', category: 'Fashion', revenue: 1850, orders: 37, conversionRate: 4.1, growth: -2.3 },
        { id: '4', name: 'Ceramic Coffee Mug Set', category: 'Home & Garden', revenue: 1680, orders: 28, conversionRate: 3.7, growth: 22.1 },
        { id: '5', name: 'Yoga Mat Premium', category: 'Sports & Fitness', revenue: 1420, orders: 19, conversionRate: 2.9, growth: 11.8 }
      ]);

      setCategoryBreakdown([
        { name: 'Electronics', value: 42, color: '#3B82F6' },
        { name: 'Fashion', value: 28, color: '#EC4899' },
        { name: 'Home & Garden', value: 18, color: '#10B981' },
        { name: 'Sports & Fitness', value: 12, color: '#F59E0B' }
      ]);

      setLoading(false);
    }, 1000);
  }, [timeRange, selectedCategory]);

  const totalRevenue = salesData.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);
  const totalCustomers = salesData.reduce((sum, day) => sum + day.customers, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  const previousWeekRevenue = 28450; // Mock previous week data
  const revenueGrowth = ((totalRevenue - previousWeekRevenue) / previousWeekRevenue) * 100;

  const StatCard = ({ title, value, icon: Icon, change, changeType }: any) => (
    <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' && title.includes('Revenue') 
            ? `€${value.toLocaleString()}` 
            : typeof value === 'number' 
            ? value.toLocaleString() 
            : value}
        </div>
        {change && (
          <div className={`flex items-center text-xs mt-1 ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'positive' ? 
              <ArrowUpRight className="h-3 w-3 mr-1" /> : 
              <ArrowDownRight className="h-3 w-3 mr-1" />
            }
            {Math.abs(change).toFixed(1)}% from last week
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Analytics</h2>
          <p className="text-gray-600">Track your sales performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={totalRevenue}
          icon={DollarSign}
          change={revenueGrowth}
          changeType={revenueGrowth >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={ShoppingCart}
          change={8.2}
          changeType="positive"
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          icon={Users}
          change={12.5}
          changeType="positive"
        />
        <StatCard
          title="Avg Order Value"
          value={avgOrderValue.toFixed(2)}
          icon={Package}
          change={-2.1}
          changeType="negative"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`€${value}`, 'Revenue']} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders vs Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Orders vs Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="customers" stroke="#EC4899" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`€${value}`, 'AOV']} />
                    <Bar dataKey="avgOrderValue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-sm">
                        #{index + 1}
                      </Badge>
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">€{product.revenue.toLocaleString()}</p>
                        <p className="text-gray-500">{product.orders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{product.conversionRate}%</p>
                        <p className="text-gray-500">conversion</p>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        product.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.growth >= 0 ? 
                          <TrendingUp className="w-4 h-4" /> : 
                          <TrendingDown className="w-4 h-4" />
                        }
                        {Math.abs(product.growth)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown as any[]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryBreakdown.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{category.value}%</p>
                        <p className="text-sm text-gray-500">of total revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">New Customers</span>
                    <span className="font-medium text-gray-900">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Returning Customers</span>
                    <span className="font-medium text-gray-900">89</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Customer Retention</span>
                    <span className="font-medium text-green-600">73%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg. CLV</span>
                    <span className="font-medium text-gray-900">€284</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Purchase Frequency</span>
                    <span className="font-medium text-gray-900">2.3x</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg. Order Value</span>
                    <span className="font-medium text-gray-900">€123</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">North Cyprus</span>
                    <span className="font-medium text-gray-900">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Turkey</span>
                    <span className="font-medium text-gray-900">22%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Other</span>
                    <span className="font-medium text-gray-900">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesAnalytics;