import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare } from 'lucide-react';

const VacancyList: React.FC = () => {
  const vacantUnits = [
    {
      id: 1,
      name: 'Sea Breeze Villa',
      code: 'FAM-V05',
      daysVacant: 12,
      lastEnquiry: '3 days ago',
      recommendedAction: 'Reduce price by 10%',
    },
    {
      id: 2,
      name: 'Garden House',
      code: 'GIR-H22',
      daysVacant: 5,
      lastEnquiry: '1 day ago',
      recommendedAction: 'Update photos',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vacant Units</CardTitle>
        <CardDescription>Properties currently available for booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {vacantUnits.map((unit) => (
          <div key={unit.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{unit.name}</h4>
                <p className="text-xs text-muted-foreground">{unit.code}</p>
              </div>
              <Badge variant="secondary">{unit.daysVacant} days vacant</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>Last enquiry: {unit.lastEnquiry}</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-700">
              <strong>Recommended:</strong> {unit.recommendedAction}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default">
                Apply Action
              </Button>
              <Button size="sm" variant="outline">
                Broadcast Listing
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default VacancyList;
