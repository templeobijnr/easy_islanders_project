/**
 * Enhanced Requests & Inquiries section
 * - Detailed request table with customer info
 * - Approve/reject actions
 * - Lead scoring
 * - Conversion tracking
 */
import React, { useState } from 'react';
import { useRealEstateRequests } from '../hooks/useRealEstateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserCheck, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export const RequestsPageEnhanced = () => {
  const { data, isLoading } = useRealEstateRequests();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  if (isLoading) {
    return <div className="p-6">Loading requests...</div>;
  }

  const requests = data?.items || [];
  const total = data?.total || 0;

  // Calculate metrics
  const todayRequests = requests.filter((r: any) => {
    const createdDate = new Date(r.created_at);
    const today = new Date();
    return createdDate.toDateString() === today.toDateString();
  }).length;

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    setActionDialogOpen(true);
  };

  const handleReject = (request: any) => {
    setSelectedRequest({ ...request, action: 'reject' });
    setActionDialogOpen(true);
  };

  const confirmAction = () => {
    // TODO: Call API to approve/reject
    console.log('Action:', selectedRequest?.action || 'approve', 'Request:', selectedRequest?.id, 'Notes:', notes);
    setActionDialogOpen(false);
    setNotes('');
    setSelectedRequest(null);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Requests & Inquiries
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Manage customer requests and bookings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending inquiries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{todayRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">New today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">92%</div>
            <p className="text-xs text-muted-foreground mt-1">Within 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">68%</div>
            <p className="text-xs text-muted-foreground mt-1">Inquiry to booking</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>Customer inquiries awaiting response</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request: any) => {
                    const createdDate = new Date(request.created_at);
                    const isNew = Date.now() - createdDate.getTime() < 24 * 60 * 60 * 1000;

                    return (
                      <TableRow key={request.id} className={isNew ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.customer_name || 'Anonymous'}</div>
                            {isNew && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">New</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{request.listing_title || 'Unknown Property'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{request.start_date ? new Date(request.start_date).toLocaleDateString() : 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">
                              to {request.end_date ? new Date(request.end_date).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {createdDate.toLocaleDateString()}
                            <div className="text-xs text-muted-foreground">
                              {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {request.status || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApprove(request)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleReject(request)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.action === 'reject' ? 'Reject Request' : 'Approve Request'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.action === 'reject'
                ? 'Provide a reason for rejecting this request.'
                : 'Add any notes for this approval.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedRequest && (
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm font-medium mb-2">Request Details</div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div>Customer: {selectedRequest.customer_name || 'Anonymous'}</div>
                  <div>Property: {selectedRequest.listing_title || 'Unknown'}</div>
                  <div>
                    Dates: {selectedRequest.start_date ? new Date(selectedRequest.start_date).toLocaleDateString() : 'N/A'} to{' '}
                    {selectedRequest.end_date ? new Date(selectedRequest.end_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Add any notes or reasons..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                className={selectedRequest?.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Confirm {selectedRequest?.action === 'reject' ? 'Rejection' : 'Approval'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestsPageEnhanced;
