import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const PipelineFunnelChart: React.FC = () => {
  const stages = [
    { name: 'Enquiries', count: 45, percentage: 100 },
    { name: 'Viewings', count: 28, percentage: 62 },
    { name: 'Offers', count: 12, percentage: 27 },
    { name: 'Under Contract', count: 5, percentage: 11 },
    { name: 'Closed', count: 3, percentage: 7 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, idx) => (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.name}</span>
                <span className="text-muted-foreground">
                  {stage.count} leads ({stage.percentage}%)
                </span>
              </div>
              <div className="relative">
                <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  <div
                    className={`h-full ${
                      idx === 0
                        ? 'bg-blue-500'
                        : idx === 1
                        ? 'bg-cyan-500'
                        : idx === 2
                        ? 'bg-yellow-500'
                        : idx === 3
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    } flex items-center justify-center text-white font-semibold`}
                    style={{ width: `${stage.percentage}%` }}
                  >
                    {stage.count}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conversion rates */}
        <div className="mt-6 p-4 bg-muted rounded space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Enquiry → Viewing:</span>
            <span className="font-semibold">62%</span>
          </div>
          <div className="flex justify-between">
            <span>Viewing → Offer:</span>
            <span className="font-semibold">43%</span>
          </div>
          <div className="flex justify-between">
            <span>Offer → Close:</span>
            <span className="font-semibold">25%</span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Overall Conversion:</span>
            <span>7%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PipelineFunnelChart;
