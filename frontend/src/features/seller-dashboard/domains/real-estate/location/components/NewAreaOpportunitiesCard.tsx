import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPinned, TrendingUp } from 'lucide-react';

const NewAreaOpportunitiesCard: React.FC = () => {
  const opportunities = [
    {
      area: 'Lefke University District',
      reason: 'High demand, low supply',
      potentialRevenue: '€4,200/mo',
      competitionLevel: 'Low',
      score: 92,
    },
    {
      area: 'Guzelyurt Coastal',
      reason: 'Emerging tourist destination',
      potentialRevenue: '€3,800/mo',
      competitionLevel: 'Medium',
      score: 78,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-green-500" />
          <CardTitle>Expansion Opportunities</CardTitle>
        </div>
        <CardDescription>Suggested areas to expand your portfolio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {opportunities.map((opp, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{opp.area}</h4>
                <p className="text-sm text-muted-foreground">{opp.reason}</p>
              </div>
              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                <TrendingUp className="h-3 w-3" />
                {opp.score}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Potential Revenue</p>
                <p className="font-semibold">{opp.potentialRevenue}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Competition</p>
                <p className="font-semibold">{opp.competitionLevel}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              View Market Analysis
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NewAreaOpportunitiesCard;
