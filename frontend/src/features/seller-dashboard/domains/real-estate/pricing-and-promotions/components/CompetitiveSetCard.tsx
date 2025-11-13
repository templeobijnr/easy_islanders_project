import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const CompetitiveSetCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitive Price Analysis</CardTitle>
        <CardDescription>Compare your rates with similar listings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Competitive pricing data coming soon</p>
          <p className="text-sm mt-2">Integration with market data providers pending</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitiveSetCard;
