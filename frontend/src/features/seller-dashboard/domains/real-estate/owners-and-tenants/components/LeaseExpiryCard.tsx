import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const LeaseExpiryCard: React.FC = () => {
  const expiringLeases = [
    { tenant: 'David Liu', property: 'Sea View Apartment', expiryDate: '2025-12-20', daysLeft: 37 },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>Lease Expiries</CardTitle>
        </div>
        <CardDescription>Upcoming lease renewals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {expiringLeases.map((lease, idx) => (
          <div key={idx} className="p-4 border border-orange-200 rounded-lg bg-orange-50 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{lease.tenant}</p>
                <p className="text-sm text-muted-foreground">{lease.property}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-700">{lease.daysLeft} days</p>
                <p className="text-xs text-muted-foreground">{lease.expiryDate}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1">
                Renew Lease
              </Button>
              <Button size="sm" variant="outline">
                Contact Tenant
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LeaseExpiryCard;
