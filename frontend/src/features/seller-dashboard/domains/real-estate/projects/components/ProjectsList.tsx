import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, TrendingUp } from 'lucide-react';

const ProjectsList: React.FC = () => {
  const projects = [
    {
      name: 'Kyrenia Marina Towers',
      totalUnits: 32,
      sold: 18,
      available: 14,
      stage: 'Under Construction',
      expectedCompletion: '2026-Q2',
    },
    {
      name: 'Famagusta Bay Villas',
      totalUnits: 18,
      sold: 12,
      available: 6,
      stage: 'Off-Plan',
      expectedCompletion: '2026-Q4',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-purple-500" />
          <CardTitle>Development Projects</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.map((project) => (
          <div key={project.name} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{project.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Expected: {project.expectedCompletion}
                </p>
              </div>
              <Badge variant="outline">{project.stage}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-muted rounded">
                <p className="text-2xl font-bold">{project.totalUnits}</p>
                <p className="text-xs text-muted-foreground">Total Units</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-700">{project.sold}</p>
                <p className="text-xs text-muted-foreground">Sold</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-2xl font-bold text-blue-700">{project.available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(project.sold / project.totalUnits) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold">
                {Math.round((project.sold / project.totalUnits) * 100)}%
              </span>
            </div>

            <Button size="sm" variant="outline" className="w-full">
              View Project Details
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProjectsList;
