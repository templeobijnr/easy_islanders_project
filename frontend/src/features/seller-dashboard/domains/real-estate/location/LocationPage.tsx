/**
 * Location section - area-based performance
 */
import { useRealEstateLocation } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const LocationPage = () => {
  const { data, isLoading, error } = useRealEstateLocation();

  if (isLoading) return <div className="p-6">Loading location data...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading location data</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Location Analytics</h1>
        <p className="text-muted-foreground mt-2">Performance insights by area</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Areas</CardTitle>
          <CardDescription>Properties grouped by location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {data?.areas.length === 0 ? 'No location data available' : `${data?.areas.length} areas`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
