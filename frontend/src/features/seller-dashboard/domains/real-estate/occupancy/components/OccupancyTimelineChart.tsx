import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const OccupancyTimelineChart: React.FC = () => {
  const monthlyData = [
    { month: 'Jan', shortTerm: 75, longTerm: 95 },
    { month: 'Feb', shortTerm: 72, longTerm: 94 },
    { month: 'Mar', shortTerm: 78, longTerm: 96 },
    { month: 'Apr', shortTerm: 82, longTerm: 97 },
    { month: 'May', shortTerm: 88, longTerm: 98 },
    { month: 'Jun', shortTerm: 92, longTerm: 99 },
    { month: 'Jul', shortTerm: 95, longTerm: 100 },
    { month: 'Aug', shortTerm: 94, longTerm: 100 },
    { month: 'Sep', shortTerm: 89, longTerm: 98 },
    { month: 'Oct', shortTerm: 83, longTerm: 97 },
    { month: 'Nov', shortTerm: 79, longTerm: 96 },
    { month: 'Dec', shortTerm: 81, longTerm: 95 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Occupancy Timeline</CardTitle>
        <CardDescription>12-month occupancy trends by rental type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-sm">Short-term</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-sm">Long-term</span>
            </div>
          </div>

          {/* Chart */}
          <div className="space-y-3">
            {monthlyData.map((data) => (
              <div key={data.month} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="w-12">{data.month}</span>
                  <span>Short: {data.shortTerm}%</span>
                  <span>Long: {data.longTerm}%</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden flex">
                    <div
                      className="bg-blue-500"
                      style={{ width: `${data.shortTerm}%` }}
                    />
                  </div>
                  <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden flex">
                    <div
                      className="bg-green-500"
                      style={{ width: `${data.longTerm}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OccupancyTimelineChart;
