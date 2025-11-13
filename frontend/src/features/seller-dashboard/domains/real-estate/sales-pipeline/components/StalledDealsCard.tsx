import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const StalledDealsCard: React.FC = () => {
  const stalledDeals = [
    {
      id: 1,
      buyer: 'Robert Lee',
      property: 'Mountain View House',
      stage: 'Offers',
      daysStalled: 18,
      issue: 'Buyer requested additional inspection',
    },
    {
      id: 2,
      buyer: 'Lisa Wong',
      property: 'Downtown Loft 3C',
      stage: 'Viewings',
      daysStalled: 12,
      issue: 'No response to follow-up emails',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <CardTitle>Stalled Deals</CardTitle>
        </div>
        <CardDescription>Deals stuck in the same stage for more than 10 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stalledDeals.map((deal) => (
          <div key={deal.id} className="p-4 border border-orange-200 rounded-lg bg-orange-50 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{deal.buyer}</p>
                <p className="text-sm text-muted-foreground">{deal.property}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-orange-700">{deal.daysStalled} days</p>
                <p className="text-xs text-muted-foreground">{deal.stage}</p>
              </div>
            </div>
            <div className="text-sm text-orange-800 bg-orange-100 p-2 rounded">
              <strong>Issue:</strong> {deal.issue}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1">
                Take Action
              </Button>
              <Button size="sm" variant="outline">
                Archive
              </Button>
            </div>
          </div>
        ))}

        {stalledDeals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No stalled deals. Keep up the great work!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StalledDealsCard;
