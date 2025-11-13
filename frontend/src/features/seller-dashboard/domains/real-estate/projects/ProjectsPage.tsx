/**
 * Projects section - off-plan developments
 */
import { useRealEstateProjects } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const ProjectsPage = () => {
  const { data, isLoading, error } = useRealEstateProjects();

  if (isLoading) return <div className="p-6">Loading projects data...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading projects data</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground mt-2">Manage off-plan developments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.total_projects || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{data?.active_projects || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects List</CardTitle>
          <CardDescription>Off-plan developments and new builds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {data?.projects.length === 0 ? 'No projects' : `${data?.projects.length} projects`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
