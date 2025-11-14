/**
 * Enhanced Maintenance section with ticket system
 * - Track maintenance tickets
 * - Assign contractors
 * - Cost tracking
 * - Priority management
 * - Status workflow
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';

// Mock data (replace with real API call)
const mockTickets = [
  {
    id: '1',
    property: 'Seaside Apartment 2B',
    issue: 'Leaking faucet in kitchen',
    priority: 'medium',
    status: 'open',
    assignedTo: 'John Plumber',
    cost: 150,
    createdAt: '2025-11-10',
  },
  {
    id: '2',
    property: 'Downtown Villa',
    issue: 'Air conditioning not working',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'AC Pros Ltd',
    cost: 450,
    createdAt: '2025-11-08',
  },
  {
    id: '3',
    property: 'Mountain Chalet',
    issue: 'Routine inspection',
    priority: 'low',
    status: 'completed',
    assignedTo: 'Inspection Co',
    cost: 100,
    createdAt: '2025-11-01',
  },
];

export const MaintenancePageEnhanced = () => {
  const [tickets, setTickets] = useState(mockTickets);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Form state
  const [newTicket, setNewTicket] = useState({
    property: '',
    issue: '',
    priority: 'medium',
    assignedTo: '',
    estimatedCost: '',
  });

  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress').length;
  const completedTickets = tickets.filter((t) => t.status === 'completed').length;
  const totalCost = tickets.reduce((sum, t) => sum + t.cost, 0);

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return <Badge className={map[priority]}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return <Badge className={map[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const handleCreateTicket = () => {
    // TODO: Call API to create ticket
    console.log('Creating ticket:', newTicket);
    setCreateDialogOpen(false);
    setNewTicket({ property: '', issue: '', priority: 'medium', assignedTo: '', estimatedCost: '' });
  };

  const handleViewDetails = (ticket: any) => {
    setSelectedTicket(ticket);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Maintenance
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Property upkeep and maintenance tracking</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{openTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{inProgressTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">EUR {totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Tickets</CardTitle>
          <CardDescription>Track all maintenance requests and work orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.property}</TableCell>
                    <TableCell>{ticket.issue}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{ticket.assignedTo || 'Unassigned'}</TableCell>
                    <TableCell className="text-right">EUR {ticket.cost.toLocaleString()}</TableCell>
                    <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleViewDetails(ticket)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Ticket Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Maintenance Ticket</DialogTitle>
            <DialogDescription>Log a new maintenance issue or work order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Input
                id="property"
                placeholder="Select or enter property name"
                value={newTicket.property}
                onChange={(e) => setNewTicket({ ...newTicket, property: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue">Issue Description</Label>
              <Textarea
                id="issue"
                placeholder="Describe the maintenance issue..."
                rows={3}
                value={newTicket.issue}
                onChange={(e) => setNewTicket({ ...newTicket, issue: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Estimated Cost (EUR)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0"
                  value={newTicket.estimatedCost}
                  onChange={(e) => setNewTicket({ ...newTicket, estimatedCost: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned">Assign To (Optional)</Label>
              <Input
                id="assigned"
                placeholder="Contractor name or company"
                value={newTicket.assignedTo}
                onChange={(e) => setNewTicket({ ...newTicket, assignedTo: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTicket}>Create Ticket</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Property</h3>
                <p className="text-sm text-muted-foreground">{selectedTicket.property}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Issue</h3>
                <p className="text-sm text-muted-foreground">{selectedTicket.issue}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Priority</h3>
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Status</h3>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Assigned To</h3>
                <p className="text-sm text-muted-foreground">{selectedTicket.assignedTo || 'Unassigned'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Cost</h3>
                <p className="text-sm text-muted-foreground">EUR {selectedTicket.cost.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Created</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedTicket.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenancePageEnhanced;
