/**
 * Activity Tab Component
 *
 * Displays recent activity, events, and timeline for portfolio
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { TabContextHeader } from './TabContextHeader';

interface ActivityTabProps {
  timePeriod: '30d' | '90d' | '1y';
}

interface ActivityItem {
  id: string;
  type: 'booking' | 'enquiry' | 'listing_created' | 'listing_updated' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'failed';
  user?: string;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ timePeriod }) => {
  // Mock activity data - in production, this would come from an API
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'booking',
      title: 'New booking received',
      description: 'Apartment in Kyrenia - Daily Rental',
      timestamp: '2 hours ago',
      status: 'success',
      user: 'John Doe',
    },
    {
      id: '2',
      type: 'enquiry',
      title: 'New enquiry',
      description: 'Villa in Famagusta - Long-term Rental',
      timestamp: '5 hours ago',
      status: 'pending',
      user: 'Jane Smith',
    },
    {
      id: '3',
      type: 'listing_created',
      title: 'New listing created',
      description: 'Studio Apartment in Nicosia',
      timestamp: '1 day ago',
      status: 'success',
    },
    {
      id: '4',
      type: 'status_change',
      title: 'Listing status updated',
      description: 'Villa in Lapta - Changed to Occupied',
      timestamp: '2 days ago',
      status: 'success',
    },
    {
      id: '5',
      type: 'booking',
      title: 'Booking cancelled',
      description: 'Penthouse in Kyrenia - Daily Rental',
      timestamp: '3 days ago',
      status: 'failed',
      user: 'Mike Johnson',
    },
  ];

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'booking':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'enquiry':
        return <FileText className="h-5 w-5 text-sky-600" />;
      case 'listing_created':
        return <CheckCircle className="h-5 w-5 text-lime-600" />;
      case 'listing_updated':
        return <AlertCircle className="h-5 w-5 text-emerald-600" />;
      case 'status_change':
        return <Clock className="h-5 w-5 text-sky-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status?: ActivityItem['status']) => {
    if (!status) return null;
    
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      success: { variant: 'default', label: 'Success' },
      pending: { variant: 'secondary', label: 'Pending' },
      failed: { variant: 'destructive', label: 'Failed' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <TabContextHeader
        title="Activity Feed"
        description="Recent changes, bookings, enquiries, and events across your portfolio."
        timePeriod={timePeriod}
        showTimePeriod={true}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Activity feed for the last {timePeriod === '30d' ? '30 days' : timePeriod === '90d' ? '90 days' : '1 year'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No activity to display</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {activity.description}
                        </p>
                        {activity.user && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                            <User className="h-3 w-3" />
                            <span>{activity.user}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(activity.status)}
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{activity.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {activities.filter(a => a.status === 'success').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Completed actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-600">
              {activities.filter(a => a.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
