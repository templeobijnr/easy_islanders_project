/**
 * Calendar section - bookings and events
 */
import { useState } from 'react';
import { useRealEstateCalendar } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const CalendarPage = () => {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  const [dateRange] = useState({
    start: today.toISOString().split('T')[0],
    end: nextMonth.toISOString().split('T')[0],
  });

  const { data } = useRealEstateCalendar(dateRange.start, dateRange.end);


  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Calendar</h1>
        <p className="text-muted-foreground mt-2 text-lg">View bookings and scheduled events</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>Upcoming bookings and appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {data?.events.length === 0 ? 'No events scheduled' : `${data?.events.length} events`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
