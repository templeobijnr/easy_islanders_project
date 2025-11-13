import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

const StaffAssignmentsCard: React.FC = () => {
  const assignments = [
    { staff: 'Anna Kowalski', task: 'Check-in: Sea View Apartment', time: '14:00' },
    { staff: 'Michael Chen', task: 'Viewing: Garden House', time: '16:00' },
    { staff: 'Elena Petrov', task: 'Maintenance: Downtown Studio', time: '09:00' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          <CardTitle>Staff Assignments</CardTitle>
        </div>
        <CardDescription>Today's task assignments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments.map((assignment, idx) => (
          <div key={idx} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{assignment.staff}</p>
                <p className="text-sm text-muted-foreground">{assignment.task}</p>
              </div>
              <p className="text-sm font-semibold">{assignment.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default StaffAssignmentsCard;
