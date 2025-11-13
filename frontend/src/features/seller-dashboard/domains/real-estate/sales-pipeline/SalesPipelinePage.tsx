/**
 * Sales Pipeline section - leads and deals tracking
 */
import { useRealEstateSalesPipeline } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const SalesPipelinePage = () => {
  const { data } = useRealEstateSalesPipeline();


  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Sales Pipeline</h1>
        <p className="text-muted-foreground mt-2 text-lg">Track leads, viewings, and deals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.total_deals || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£{parseFloat(data?.pipeline_value || '0').toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Stages</CardTitle>
          <CardDescription>Deals by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.stages.map((stage: any) => (
              <div key={stage.stage} className="flex justify-between items-center">
                <span className="capitalize">{stage.stage}</span>
                <span className="font-semibold">{stage.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
