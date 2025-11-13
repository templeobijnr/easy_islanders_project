/**
 * Maintenance section - work orders and tickets
 */
import { useRealEstateMaintenance } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const MaintenancePage = () => {
  const { data, isLoading, error } = useRealEstateMaintenance();

  if (isLoading) return <div className="p-6">Loading maintenance data...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading maintenance data</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Maintenance</h1>
        <p className="text-muted-foreground mt-2">Track maintenance tickets and work orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.total_tickets || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{data?.open_tickets || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{data?.overdue_tickets || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Tickets</CardTitle>
          <CardDescription>Recent work orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {data?.tickets.length === 0 ? 'No maintenance tickets' : `${data?.tickets.length} tickets`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
