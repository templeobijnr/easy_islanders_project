/**
 * Requests section - customer inquiries
 */
import { useRealEstateRequests } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const RequestsPage = () => {
  const { data, isLoading, error } = useRealEstateRequests();

  if (isLoading) return <div className="p-6">Loading requests data...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading requests data</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Requests & Inquiries</h1>
        <p className="text-muted-foreground mt-2">Manage customer requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.total_requests || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{data?.unread_count || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Latest customer inquiries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {data?.requests.length === 0 ? 'No requests' : `${data?.requests.length} requests`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
