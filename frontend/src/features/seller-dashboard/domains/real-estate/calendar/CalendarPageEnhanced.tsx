/**
 * Enhanced Calendar section with FullCalendar
 * - Visual calendar with bookings and maintenance blocks
 * - Event filtering
 * - Month/week views
 * - Event details on click
 */
import React, { useState, useMemo } from 'react';
import { useRealEstateCalendar } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - FullCalendar types may not be available
import FullCalendar from '@fullcalendar/react';
// @ts-ignore
import dayGridPlugin from '@fullcalendar/daygrid';
// @ts-ignore
import timeGridPlugin from '@fullcalendar/timegrid';
// @ts-ignore
import interactionPlugin from '@fullcalendar/interaction';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, CheckCircle, AlertCircle } from 'lucide-react';

export const CalendarPageEnhanced = () => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Get current month range
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];

  const { data, isLoading } = useRealEstateCalendar(startDate, endDate);

  // Transform backend events to FullCalendar format
  const calendarEvents = useMemo(() => {
    const events = data?.events || [];
    return events.map((event: any) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      backgroundColor: event.kind === 'booking' ? '#10b981' : '#f59e0b',
      borderColor: event.kind === 'booking' ? '#059669' : '#d97706',
      extendedProps: {
        kind: event.kind,
        listing_id: event.listing_id,
        listing_title: event.listing_title,
      },
    }));
  }, [data]);

  const handleEventClick = (info: any) => {
    setSelectedEvent({
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps,
    });
    setEventDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Loading calendar...</div>;
  }

  const bookingCount = calendarEvents.filter((e: any) => e.extendedProps.kind === 'booking').length;
  const blockCount = calendarEvents.filter((e: any) => e.extendedProps.kind === 'block').length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Calendar
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Bookings, viewings, and maintenance schedule</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calendarEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Next 2 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{bookingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed reservations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Dates</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{blockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Maintenance/unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Event Calendar</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-xs">Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span className="text-xs">Blocked/Maintenance</span>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="calendar-container">
            {/* @ts-ignore - FullCalendar component type issues */}
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek',
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              height="auto"
              editable={false}
              selectable={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Badge className={selectedEvent.kind === 'booking' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                  {selectedEvent.kind === 'booking' ? 'Booking' : 'Blocked'}
                </Badge>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Title</h3>
                <p className="text-sm text-muted-foreground">{selectedEvent.title}</p>
              </div>
              {selectedEvent.listing_title && (
                <div>
                  <h3 className="font-semibold mb-1">Property</h3>
                  <p className="text-sm text-muted-foreground">{selectedEvent.listing_title}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-1">Start</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.start ? new Date(selectedEvent.start).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">End</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.end ? new Date(selectedEvent.end).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CalendarPageEnhanced;
