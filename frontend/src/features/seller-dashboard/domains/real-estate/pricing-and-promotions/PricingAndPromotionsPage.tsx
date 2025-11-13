/**
 * Pricing and Promotions section - smart pricing
 */
import { useRealEstatePricingAndPromotions } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const PricingAndPromotionsPage = () => {
  const { data, isLoading, error } = useRealEstatePricingAndPromotions();

  if (isLoading) return <div className="p-6">Loading pricing data...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading pricing data</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pricing & Promotions</h1>
        <p className="text-muted-foreground mt-2">Smart pricing and discount management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Discounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.active_discounts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Discount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{((data?.avg_discount_percentage || 0) * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Suggestions</CardTitle>
          <CardDescription>AI-powered pricing recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {data?.suggestions.length === 0 ? 'No suggestions' : `${data?.suggestions.length} suggestions`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
