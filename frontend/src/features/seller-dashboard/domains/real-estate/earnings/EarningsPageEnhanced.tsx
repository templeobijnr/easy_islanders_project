/**
 * Enhanced Earnings section with charts
 * - Revenue and expense tracking with charts
 * - By-property breakdown
 * - Top performers
 * - Profit margins
 */
import { useRealEstateEarnings } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const EarningsPageEnhanced = () => {
  const { data, isLoading } = useRealEstateEarnings();

  if (isLoading) {
    return <div className="p-6">Loading earnings data...</div>;
  }

  const summary = data?.summary || {};
  const byProperty = data?.by_property || [];
  const topPerformers = data?.top_performers || [];

  // Calculate month-over-month change (if we had historical data)
  const monthTotal = parseFloat(summary.month_total || '0');
  const ytdTotal = parseFloat(summary.ytd_total || '0');
  const avgMonthly = ytdTotal / (new Date().getMonth() + 1 || 1);
  const monthChange = monthTotal - avgMonthly;
  const monthChangePercent = avgMonthly > 0 ? ((monthChange / avgMonthly) * 100).toFixed(1) : 0;

  // Prepare data for charts
  const propertyRevenueData = byProperty
    .slice(0, 10) // Top 10
    .map((p: any) => ({
      name: p.title?.substring(0, 20) || 'Unknown',
      revenue: parseFloat(p.monthly_revenue || '0'),
    }));

  const topPerformersData = topPerformers.map((p: any, idx: number) => ({
    name: p.title?.substring(0, 15) || `Property ${idx + 1}`,
    value: parseFloat(p.monthly_revenue || '0'),
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Earnings
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Revenue, expenses, and financial performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summary.currency || 'EUR'} {monthTotal.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {monthChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={monthChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {monthChangePercent}%
              </span>
              <span className="ml-1">vs. avg. monthly</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YTD Revenue</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summary.currency || 'EUR'} {ytdTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Year to date earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Monthly</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summary.currency || 'EUR'} {avgMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average per month (YTD)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Property Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Property</CardTitle>
            <CardDescription>Monthly earnings breakdown (Top 10)</CardDescription>
          </CardHeader>
          <CardContent>
            {propertyRevenueData.length === 0 ? (
              <div className="text-sm text-muted-foreground">No revenue data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={propertyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `${summary.currency || 'EUR'} ${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Performers Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Revenue distribution (Top 5)</CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformersData.length === 0 ? (
              <div className="text-sm text-muted-foreground">No performance data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topPerformersData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topPerformersData.map((entry: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${summary.currency || 'EUR'} ${value.toLocaleString()}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Properties Table */}
      {byProperty.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Properties</CardTitle>
            <CardDescription>Detailed revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Property</th>
                    <th className="text-right p-2 font-medium">Monthly Revenue</th>
                    <th className="text-right p-2 font-medium">YTD Revenue</th>
                    <th className="text-right p-2 font-medium">Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {byProperty.map((p: any, idx: number) => {
                    const monthRev = parseFloat(p.monthly_revenue || '0');
                    const ytdRev = parseFloat(p.ytd_revenue || '0');
                    const contribution = monthTotal > 0 ? ((monthRev / monthTotal) * 100).toFixed(1) : 0;

                    return (
                      <tr key={p.id || idx} className="border-b hover:bg-gray-50">
                        <td className="p-2">{p.title || 'Unknown'}</td>
                        <td className="text-right p-2">
                          {summary.currency || 'EUR'} {monthRev.toLocaleString()}
                        </td>
                        <td className="text-right p-2">
                          {summary.currency || 'EUR'} {ytdRev.toLocaleString()}
                        </td>
                        <td className="text-right p-2 font-medium">{contribution}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-gray-50">
                    <td className="p-2">Total</td>
                    <td className="text-right p-2">
                      {summary.currency || 'EUR'} {monthTotal.toLocaleString()}
                    </td>
                    <td className="text-right p-2">
                      {summary.currency || 'EUR'} {ytdTotal.toLocaleString()}
                    </td>
                    <td className="text-right p-2">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EarningsPageEnhanced;
