import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, AlertCircle } from 'lucide-react';

const MaintenanceTicketsBoard: React.FC = () => {
  const tickets = {
    new: [
      { id: 1, property: 'Villa Sunset', issue: 'Pool pump not working', severity: 'high' },
    ],
    inProgress: [
      { id: 2, property: 'Sea View Apartment', issue: 'AC unit servicing', severity: 'medium' },
      { id: 3, property: 'Garden House', issue: 'Fence repair', severity: 'low' },
    ],
    waiting: [
      { id: 4, property: 'Downtown Studio', issue: 'Awaiting replacement parts', severity: 'medium' },
    ],
    done: [
      { id: 5, property: 'Mountain View', issue: 'Plumbing fixed', severity: 'high' },
    ],
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: 'destructive' as const,
      medium: 'default' as const,
      low: 'secondary' as const,
    };
    return <Badge variant={variants[severity as keyof typeof variants]}>{severity}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-orange-500" />
          <CardTitle>Maintenance Tickets</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* New */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              New <Badge variant="outline">{tickets.new.length}</Badge>
            </h4>
            {tickets.new.map((ticket) => (
              <div key={ticket.id} className="p-3 border rounded-lg bg-red-50 space-y-2">
                <p className="font-medium text-sm">{ticket.property}</p>
                <p className="text-xs text-muted-foreground">{ticket.issue}</p>
                {getSeverityBadge(ticket.severity)}
              </div>
            ))}
          </div>

          {/* In Progress */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              In Progress <Badge variant="outline">{tickets.inProgress.length}</Badge>
            </h4>
            {tickets.inProgress.map((ticket) => (
              <div key={ticket.id} className="p-3 border rounded-lg bg-blue-50 space-y-2">
                <p className="font-medium text-sm">{ticket.property}</p>
                <p className="text-xs text-muted-foreground">{ticket.issue}</p>
                {getSeverityBadge(ticket.severity)}
              </div>
            ))}
          </div>

          {/* Waiting */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              Waiting <Badge variant="outline">{tickets.waiting.length}</Badge>
            </h4>
            {tickets.waiting.map((ticket) => (
              <div key={ticket.id} className="p-3 border rounded-lg bg-yellow-50 space-y-2">
                <p className="font-medium text-sm">{ticket.property}</p>
                <p className="text-xs text-muted-foreground">{ticket.issue}</p>
                {getSeverityBadge(ticket.severity)}
              </div>
            ))}
          </div>

          {/* Done */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              Done <Badge variant="outline">{tickets.done.length}</Badge>
            </h4>
            {tickets.done.map((ticket) => (
              <div key={ticket.id} className="p-3 border rounded-lg bg-green-50 space-y-2">
                <p className="font-medium text-sm">{ticket.property}</p>
                <p className="text-xs text-muted-foreground">{ticket.issue}</p>
                {getSeverityBadge(ticket.severity)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceTicketsBoard;
