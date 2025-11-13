/**
 * Portfolio section - property units overview
 */
import { useRealEstatePortfolio } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const PortfolioPage = () => {
  const { data } = useRealEstatePortfolio();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Portfolio
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Your property portfolio overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-['Space_Grotesk']">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-['Space_Grotesk']">{data?.total_units || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-['Space_Grotesk']">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-['Space_Grotesk']">
              £{parseFloat(data?.total_value || '0').toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-['Space_Grotesk']">Unit Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {data?.unit_mix && Object.entries(data.unit_mix).map(([type, count]) => (
                <div key={type} className="flex justify-between">
<<<<<<< Updated upstream
                  <span className="capitalize text-slate-600">{type}:</span>
                  <span className="font-semibold">{count}</span>
=======
                  <span className="capitalize">{type}:</span>
                  <span className="font-semibold">{String(count)}</span>
>>>>>>> Stashed changes
                </div>
              ))}
              {(!data?.unit_mix || Object.keys(data.unit_mix).length === 0) && (
                <span className="text-muted-foreground">No data</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-['Space_Grotesk']">Property Units</CardTitle>
          <CardDescription>All properties in your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {data?.units?.length === 0 ? 'No properties found' : `${data?.units?.length || 0} properties`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
