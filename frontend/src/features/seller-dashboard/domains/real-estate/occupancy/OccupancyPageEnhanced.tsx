/**
 * Enhanced Occupancy section with timeline charts and forecasting
 * - 6-month occupancy trend
 * - Vacancy breakdown
 * - Seasonal patterns
 * - Performance alerts
 */
import { useRealEstateOccupancy } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const OccupancyPageEnhanced = () => {
  const { data, isLoading } = useRealEstateOccupancy();

  if (isLoading) {
    return <div className="p-6">Loading occupancy data...</div>;
  }

  const timeline = data?.timeline || [];
  const vacancy = data?.vacancy || [];

  // Calculate metrics
  const latestData = timeline[timeline.length - 1];
  const previousData = timeline[timeline.length - 2];
  const currentRate = latestData?.occupancy_rate || 0;
  const previousRate = previousData?.occupancy_rate || 0;
  const rateChange = currentRate - previousRate;
  const rateChangePercent = previousRate > 0 ? ((rateChange / previousRate) * 100).toFixed(1) : 0;

  // Calculate average occupancy
  const avgRate =
    timeline.length > 0
      ? timeline.reduce((sum: number, item: { occupancy_rate?: number }) => sum + (item.occupancy_rate || 0), 0) / timeline.length
      : 0;

  // Determine performance status
  const getPerformanceStatus = (rate: number) => {
    if (rate >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    if (rate >= 60) return { label: 'Good', color: 'bg-blue-100 text-blue-800', icon: TrendingUp };
    if (rate >= 40) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { label: 'Needs Attention', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
  };

  const currentStatus = getPerformanceStatus(currentRate);
  const StatusIcon = currentStatus.icon;

  // Find peak and low months
  const peakMonth = timeline.reduce(
    (max: { occupancy_rate?: number } | undefined, item: { occupancy_rate?: number }) => {
      const occ = item?.occupancy_rate ?? 0;
      const maxOcc = max?.occupancy_rate ?? 0;
      return occ > maxOcc ? item : max;
    },
    timeline[0] || { occupancy_rate: 0 } as any
  );
  const lowMonth = timeline.reduce(
    (min: { occupancy_rate?: number } | undefined, item: { occupancy_rate?: number }) => {
      const occ = item?.occupancy_rate ?? 0;
      const minOcc = min?.occupancy_rate ?? 100;
      return occ < minOcc ? item : min;
    },
    timeline[0] || { occupancy_rate: 100 } as any
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Occupancy
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Track occupancy rates and vacancy trends</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {rateChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={rateChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {rateChangePercent}%
              </span>
              <span className="ml-1">vs. last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">6-Month Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Average across all months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <Badge className={currentStatus.color}>{currentStatus.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentRate >= 80
                ? 'Outstanding performance'
                : currentRate >= 60
                ? 'On track for good returns'
                : currentRate >= 40
                ? 'Room for improvement'
                : 'Consider pricing adjustments'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacant Units</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vacancy[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently vacant</p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Timeline Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Occupancy Timeline</CardTitle>
          <CardDescription>Last 6 months trend with target benchmark</CardDescription>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="text-sm text-muted-foreground">No occupancy data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} label={{ value: 'Occupancy %', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <ReferenceLine
                  y={70}
                  label="Target (70%)"
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                />
                <Area
                  type="monotone"
                  dataKey="occupancy_rate"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorOccupancy)"
                  name="Occupancy Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak and Low Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Highlights</CardTitle>
            <CardDescription>Best and lowest performing months</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {peakMonth && (
              <div className="flex items-start justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-900">Peak Month</span>
                  </div>
                  <p className="text-sm text-green-700">
                    {peakMonth.label} - {peakMonth.occupancy_rate.toFixed(1)}% occupancy
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {peakMonth.occupied_nights} nights occupied out of {peakMonth.total_nights}
                  </p>
                </div>
              </div>
            )}

            {lowMonth && (
              <div className="flex items-start justify-between p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-amber-900">Lowest Month</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    {lowMonth.label} - {lowMonth.occupancy_rate.toFixed(1)}% occupancy
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {lowMonth.occupied_nights} nights occupied out of {lowMonth.total_nights}
                  </p>
                </div>
              </div>
            )}

            {timeline.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-sm mb-2">Insights</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    • Occupancy variation:{' '}
                    {peakMonth && lowMonth
                      ? `${(peakMonth.occupancy_rate - lowMonth.occupancy_rate).toFixed(1)}%`
                      : 'N/A'}
                  </li>
                  <li>
                    • Trend:{' '}
                    {rateChange > 0 ? '📈 Improving' : rateChange < 0 ? '📉 Declining' : '➡️ Stable'}
                  </li>
                  <li>
                    • Target achievement: {currentRate >= 70 ? '✅ Meeting target' : '⚠️ Below target'}
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actionable Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Actions to improve occupancy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentRate < 60 && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-medium text-sm text-blue-900 mb-1">💡 Pricing Strategy</h4>
                  <p className="text-xs text-blue-700">
                    Consider reducing rates by 10-15% to attract more bookings during low seasons.
                  </p>
                </div>
              )}

              {vacancy[0]?.count > 0 && (
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <h4 className="font-medium text-sm text-purple-900 mb-1">🎯 Marketing Boost</h4>
                  <p className="text-xs text-purple-700">
                    You have {vacancy[0].count} vacant {vacancy[0].count === 1 ? 'property' : 'properties'}.
                    Increase visibility on booking platforms.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-medium text-sm text-green-900 mb-1">📅 Seasonal Planning</h4>
                <p className="text-xs text-green-700">
                  {peakMonth
                    ? `Peak season: ${peakMonth.label}. Plan promotions for low months.`
                    : 'Track seasonal patterns to optimize pricing.'}
                </p>
              </div>

              {currentRate >= 80 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <h4 className="font-medium text-sm text-amber-900 mb-1">💰 Premium Pricing</h4>
                  <p className="text-xs text-amber-700">
                    High demand detected! Consider increasing rates by 5-10% to maximize revenue.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OccupancyPageEnhanced;
