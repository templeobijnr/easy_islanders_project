import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, Info } from 'lucide-react';

const RequestsInbox: React.FC = () => {
  const requests = [
    {
      id: 1,
      type: 'viewing',
      customer: 'Emma Watson',
      property: 'Sea View Apartment A12',
      desiredDates: '2025-11-18',
      status: 'new',
      createdAt: '2 hours ago',
    },
    {
      id: 2,
      type: 'booking',
      customer: 'David Liu',
      property: 'Villa Sunset Dreams',
      desiredDates: '2025-12-10 - 2025-12-17',
      status: 'in_progress',
      createdAt: '5 hours ago',
    },
    {
      id: 3,
      type: 'info',
      customer: 'Anna Kowalski',
      property: 'Garden House',
      desiredDates: '-',
      status: 'new',
      createdAt: '1 day ago',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'viewing':
        return <Eye className="h-4 w-4" />;
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'new' ? (
      <Badge variant="default">New</Badge>
    ) : status === 'in_progress' ? (
      <Badge variant="secondary">In Progress</Badge>
    ) : (
      <Badge variant="outline">Completed</Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requests Inbox</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="p-4 border rounded-lg space-y-3 hover:bg-muted/50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  {getTypeIcon(request.type)}
                </div>
                <div>
                  <p className="font-semibold">{request.customer}</p>
                  <p className="text-sm text-muted-foreground">{request.property}</p>
                  <p className="text-xs text-muted-foreground mt-1">{request.createdAt}</p>
                </div>
              </div>
              {getStatusBadge(request.status)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Desired Dates:</span>
              <span className="font-medium">{request.desiredDates}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1">
                View & Respond
              </Button>
              <Button size="sm" variant="outline">
                Quick Reply
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RequestsInbox;
