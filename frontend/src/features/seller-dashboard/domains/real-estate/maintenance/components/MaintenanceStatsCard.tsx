import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const MaintenanceStatsCard: React.FC = () => {
  const stats = {
    openTickets: 4,
    avgResolution: '2.3 days',
    commonIssues: [
      { issue: 'HVAC/AC', count: 8 },
      { issue: 'Plumbing', count: 6 },
      { issue: 'Electrical', count: 4 },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <p className="text-3xl font-bold text-orange-600">{stats.openTickets}</p>
            <p className="text-sm text-muted-foreground">Open Tickets</p>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.avgResolution}</p>
            <p className="text-sm text-muted-foreground">Avg Resolution</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">Most Common Issues</h4>
          <div className="space-y-2">
            {stats.commonIssues.map((item) => (
              <div key={item.issue} className="flex items-center justify-between">
                <span className="text-sm">{item.issue}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceStatsCard;
