import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb, TrendingUp } from 'lucide-react';

const LocationInsightsCard: React.FC = () => {
  const insights = [
    {
      title: 'University Proximity Premium',
      description:
        'Properties near Eastern Mediterranean University have 20% higher occupancy at slightly lower average price',
      impact: 'high',
    },
    {
      title: 'Beach Access Demand',
      description:
        'Famagusta beachfront properties command 35% price premium with consistent 85%+ occupancy',
      impact: 'high',
    },
    {
      title: 'Seasonal Kyrenia Trend',
      description:
        'Kyrenia center sees 40% increase in bookings during summer months (June-September)',
      impact: 'medium',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <CardTitle>Location Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, idx) => (
          <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-blue-900">{insight.title}</h4>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-sm text-blue-700">{insight.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LocationInsightsCard;
