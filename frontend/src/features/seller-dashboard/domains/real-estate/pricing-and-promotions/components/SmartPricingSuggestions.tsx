import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';

const SmartPricingSuggestions: React.FC = () => {
  const suggestions = [
    {
      property: 'Sea Breeze Villa',
      currentRate: '€280',
      suggestedRate: '€245',
      change: -12,
      reason: 'Increase occupancy from 35% to 65%',
      impact: 'high',
    },
    {
      property: 'Downtown Studio 5B',
      currentRate: '€850',
      suggestedRate: '€920',
      change: +8,
      reason: 'Rate is 18% below comparable properties',
      impact: 'medium',
    },
    {
      property: 'Garden House',
      currentRate: '€180',
      suggestedRate: '€165',
      change: -8,
      reason: 'Boost bookings for next 2 weeks',
      impact: 'medium',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <CardTitle>Smart Pricing Suggestions</CardTitle>
        </div>
        <CardDescription>AI-powered rate optimization recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{suggestion.property}</p>
                <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold">
                {suggestion.change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={suggestion.change > 0 ? 'text-green-600' : 'text-red-600'}>
                  {suggestion.change > 0 ? '+' : ''}
                  {suggestion.change}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <div>
                <p className="text-xs text-muted-foreground">Current Rate</p>
                <p className="font-semibold">{suggestion.currentRate}</p>
              </div>
              <div className="text-2xl text-muted-foreground">→</div>
              <div>
                <p className="text-xs text-muted-foreground">Suggested Rate</p>
                <p className="font-bold text-primary">{suggestion.suggestedRate}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1">
                Apply Suggestion
              </Button>
              <Button size="sm" variant="outline">
                Customize
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SmartPricingSuggestions;
