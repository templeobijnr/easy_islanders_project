import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';

const MultiPropertyCalendar: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Property Calendar</CardTitle>
        <CardDescription>View bookings, check-ins, viewings, and maintenance across all properties</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-12 min-h-[500px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4" />
            <p className="font-semibold text-lg">Interactive Calendar Coming Soon</p>
            <p className="text-sm mt-2">Full calendar view with property timeline integration</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiPropertyCalendar;
