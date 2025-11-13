import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertTriangle } from 'lucide-react';

const OccupancyForecastCard: React.FC = () => {
  const forecast = [
    { month: 'Next Month', predicted: 87, confidence: 'high', risks: [] },
    { month: '2 Months', predicted: 82, confidence: 'medium', risks: ['Summer season ending'] },
    { month: '3 Months', predicted: 76, confidence: 'medium', risks: ['August still underbooked', 'School holiday competition'] },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <CardTitle>Occupancy Forecast</CardTitle>
        </div>
        <CardDescription>AI-powered predictions for next 3 months</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {forecast.map((item, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{item.month}</h4>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{item.predicted}%</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {item.confidence} confidence
                </p>
              </div>
            </div>

            {item.risks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm font-semibold text-orange-700">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Risk Flags</span>
                </div>
                {item.risks.map((risk, rIdx) => (
                  <div key={rIdx} className="text-sm text-orange-600 pl-4">
                    • {risk}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OccupancyForecastCard;
