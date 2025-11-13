/**
 * Owners and Tenants section - relationship management
 */
import { useRealEstateOwnersAndTenants } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const OwnersAndTenantsPage = () => {
  const { data, isLoading, error } = useRealEstateOwnersAndTenants();

  if (isLoading) return <div className="p-6">Loading owners and tenants data...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading owners and tenants data</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Owners & Tenants</h1>
        <p className="text-muted-foreground mt-2">Manage relationships and contacts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.total_owners || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.total_tenants || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Owners Directory</CardTitle>
            <CardDescription>Property owners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {data?.owners.length === 0 ? 'No owners' : `${data?.owners.length} owners`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tenants Directory</CardTitle>
            <CardDescription>Active tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {data?.tenants.length === 0 ? 'No tenants' : `${data?.tenants.length} tenants`}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
