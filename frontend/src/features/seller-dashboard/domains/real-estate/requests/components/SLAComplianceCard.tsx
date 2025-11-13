import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle } from 'lucide-react';

const SLAComplianceCard: React.FC = () => {
  const metrics = {
    avgResponseTime: '45 minutes',
    within1Hour: 85,
    within24Hours: 98,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SLA Compliance</CardTitle>
        <CardDescription>Response time metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
          <p className="text-3xl font-bold">{metrics.avgResponseTime}</p>
          <p className="text-sm text-muted-foreground">Average Response Time</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Within 1 hour</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${metrics.within1Hour}%` }} />
              </div>
              <span className="text-sm font-semibold">{metrics.within1Hour}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Within 24 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${metrics.within24Hours}%` }} />
              </div>
              <span className="text-sm font-semibold">{metrics.within24Hours}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SLAComplianceCard;
