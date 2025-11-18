/**
 * Portfolio section - property units overview
 */
import { useRealEstatePortfolio } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const PortfolioPage = () => {
  const { data, isLoading, error } = useRealEstatePortfolio();

  if (isLoading) return <div className="p-6">Loading portfolio data...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading portfolio</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground mt-2">Your property portfolio overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.total_units || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£{parseFloat(data?.total_value || '0').toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unit Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {data?.unit_mix && Object.entries(data.unit_mix).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span className="capitalize">{type}:</span>
                  <span className="font-semibold">{String(count)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Units</CardTitle>
          <CardDescription>All properties in your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {data?.units.length === 0 ? 'No properties found' : `${data?.units.length} properties`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
