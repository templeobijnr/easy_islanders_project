/**
 * Location section - area-based performance
 */
import { useRealEstateLocation } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const LocationPage = () => {
  const { data } = useRealEstateLocation();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Location Analytics
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Performance insights by area</p>
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
