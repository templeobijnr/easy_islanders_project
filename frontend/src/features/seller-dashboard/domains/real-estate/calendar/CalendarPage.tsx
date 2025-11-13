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

  const { data, isLoading, error } = useRealEstateCalendar(dateRange.start, dateRange.end);

  if (isLoading) return <div className="p-6">Loading calendar data...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading calendar data</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground mt-2">View bookings and scheduled events</p>
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
