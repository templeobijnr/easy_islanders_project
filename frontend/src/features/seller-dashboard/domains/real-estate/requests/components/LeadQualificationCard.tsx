import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Minus, TrendingDown } from 'lucide-react';

const LeadQualificationCard: React.FC = () => {
  const qualifiedLeads = [
    { customer: 'Emma Watson', score: 92, intent: 'High Intent', property: 'Sea View Apartment' },
    { customer: 'David Liu', score: 78, intent: 'Medium Intent', property: 'Villa Sunset' },
    { customer: 'Anna Kowalski', score: 45, intent: 'Cold', property: 'Garden House' },
  ];

  const getIntentBadge = (intent: string) => {
    if (intent === 'High Intent') {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          High Intent
        </Badge>
      );
    } else if (intent === 'Medium Intent') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Minus className="h-3 w-3" />
          Medium
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <TrendingDown className="h-3 w-3" />
        Cold
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Qualification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {qualifiedLeads.map((lead) => (
          <div key={lead.customer} className="p-3 border rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold">{lead.customer}</p>
              <p className="text-xs text-muted-foreground">{lead.property}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{lead.score}</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              {getIntentBadge(lead.intent)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LeadQualificationCard;
