import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckIn, LogOut, Eye, Wrench } from 'lucide-react';

const TodayOperationsCard: React.FC = () => {
  const todayEvents = [
    {
      type: 'check-in',
      time: '14:00',
      property: 'Sea View Apartment A12',
      guest: 'John Smith',
      icon: CheckIn,
    },
    {
      type: 'check-out',
      time: '11:00',
      property: 'Villa Sunset Dreams',
      guest: 'Maria Garcia',
      icon: LogOut,
    },
    {
      type: 'viewing',
      time: '16:00',
      property: 'Garden House',
      guest: 'Sarah Johnson',
      icon: Eye,
    },
    {
      type: 'maintenance',
      time: '09:00',
      property: 'Downtown Studio 5B',
      guest: 'AC Repair',
      icon: Wrench,
    },
  ];

  const getEventBadge = (type: string) => {
    const config: Record<string, any> = {
      'check-in': { variant: 'default', label: 'Check-in' },
      'check-out': { variant: 'secondary', label: 'Check-out' },
      viewing: { variant: 'outline', label: 'Viewing' },
      maintenance: { variant: 'destructive', label: 'Maintenance' },
    };
    return <Badge variant={config[type].variant}>{config[type].label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {todayEvents.map((event, idx) => {
          const Icon = event.icon;
          return (
            <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-primary/10 rounded">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{event.property}</p>
                <p className="text-sm text-muted-foreground">{event.guest}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{event.time}</p>
                {getEventBadge(event.type)}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TodayOperationsCard;
