/**
 * Earnings section - revenue and expenses
 */
import { useRealEstateEarnings } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const EarningsPage = () => {
  const { data, isLoading, error } = useRealEstateEarnings();

  if (isLoading) return <div className="p-6">Loading earnings data...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading earnings data</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Earnings</h1>
        <p className="text-muted-foreground mt-2">Revenue, expenses, and financial performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£{parseFloat(data?.total_revenue || '0').toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£{parseFloat(data?.total_expenses || '0').toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">£{parseFloat(data?.net_income || '0').toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Timeline</CardTitle>
          <CardDescription>Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {data?.revenue_series.length === 0 ? 'No revenue data' : `${data?.revenue_series.length} months`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
