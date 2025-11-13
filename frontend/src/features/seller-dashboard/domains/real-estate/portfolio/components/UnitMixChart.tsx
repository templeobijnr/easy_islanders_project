import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const UnitMixChart: React.FC = () => {
  const unitMix = [
    { type: 'Studio', count: 4, color: 'bg-blue-500', percentage: 17 },
    { type: '1 Bedroom', count: 6, color: 'bg-green-500', percentage: 25 },
    { type: '2 Bedroom', count: 8, color: 'bg-yellow-500', percentage: 33 },
    { type: '3+ Bedroom', count: 4, color: 'bg-purple-500', percentage: 17 },
    { type: 'Villas', count: 2, color: 'bg-pink-500', percentage: 8 },
  ];

  const total = unitMix.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Mix Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simple Bar Chart */}
        <div className="space-y-3">
          {unitMix.map((item) => (
            <div key={item.type} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.type}</span>
                <span className="text-muted-foreground">
                  {item.count} units ({item.percentage}%)
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-2">
            {unitMix.map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-xs text-muted-foreground">{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnitMixChart;
