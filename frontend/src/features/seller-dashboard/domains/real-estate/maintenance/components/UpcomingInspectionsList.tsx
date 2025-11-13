import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

const UpcomingInspectionsList: React.FC = () => {
  const inspections = [
    { property: 'Sea View Apartment A12', type: 'Fire Safety', date: '2025-11-20', daysUntil: 7 },
    { property: 'Villa Sunset Dreams', type: 'Pool Inspection', date: '2025-11-25', daysUntil: 12 },
    { property: 'Garden House', type: 'Gas Certificate Renewal', date: '2025-12-01', daysUntil: 18 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Inspections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {inspections.map((inspection, idx) => (
          <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold">{inspection.property}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{inspection.date}</span>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={inspection.daysUntil < 10 ? 'destructive' : 'secondary'}>
                {inspection.daysUntil} days
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{inspection.type}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UpcomingInspectionsList;
