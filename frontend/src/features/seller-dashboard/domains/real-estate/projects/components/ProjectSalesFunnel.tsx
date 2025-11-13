import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const ProjectSalesFunnel: React.FC = () => {
  const funnelData = [
    { stage: 'Enquiries', count: 62 },
    { stage: 'Site Visits', count: 38 },
    { stage: 'Offers', count: 24 },
    { stage: 'Reservations', count: 18 },
    { stage: 'Contracts Signed', count: 15 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Sales Funnel</CardTitle>
        <CardDescription>Off-plan sales pipeline across all projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnelData.map((item, idx) => (
            <div key={item.stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.stage}</span>
                <span className="text-muted-foreground">{item.count} leads</span>
              </div>
              <div className="relative">
                <div className="w-full h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold"
                    style={{ width: `${(item.count / funnelData[0].count) * 100}%` }}
                  >
                    {item.count}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectSalesFunnel;
