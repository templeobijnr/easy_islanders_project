/**
 * Occupancy section - occupancy rates and trends
 */
import { useRealEstateOccupancy } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const OccupancyPage = () => {
  const { data } = useRealEstateOccupancy();


  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Occupancy</h1>
        <p className="text-muted-foreground mt-2 text-lg">Track occupancy rates and trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{((data?.current_occupancy_rate || 0) * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{((data?.avg_occupancy_rate || 0) * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Occupancy Timeline</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {data?.series.length === 0 ? 'No occupancy data' : `${data?.series.length} data points`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
