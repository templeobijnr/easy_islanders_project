import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const DiscountCampaignsCard: React.FC = () => {
  const campaigns = [
    { name: 'Last-Minute 15% Off', status: 'active', properties: 8, bookings: 12, validUntil: '2025-12-31' },
    { name: 'Summer Early Bird', status: 'scheduled', properties: 12, bookings: 0, validUntil: '2026-06-01' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Discount Campaigns</CardTitle>
          <Button size="sm" variant="outline">
            Create Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {campaigns.map((campaign, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{campaign.name}</h4>
              <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                {campaign.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Properties</p>
                <p className="font-semibold">{campaign.properties}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bookings</p>
                <p className="font-semibold">{campaign.bookings}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valid Until</p>
                <p className="font-semibold text-xs">{campaign.validUntil}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                Edit
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                View Report
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DiscountCampaignsCard;
