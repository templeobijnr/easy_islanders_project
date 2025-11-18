/**
 * ActivityTab - Activity timeline and history
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  MessageSquare,
  DollarSign,
  Edit,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  Lock,
  Unlock,
  TrendingUp,
  User,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { useListingEvents } from '../hooks/useRealEstateData';
import type { ListingEvent } from '../types/realEstateModels';

type ActivityType =
  | 'booking_created'
  | 'booking_cancelled'
  | 'message_received'
  | 'request_received'
  | 'request_approved'
  | 'request_declined'
  | 'price_updated'
  | 'listing_updated'
  | 'listing_viewed'
  | 'review_received'
  | 'date_blocked'
  | 'date_unblocked'
  | 'photo_added';

interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  title: string;
  description: string;
  metadata?: {
    user_name?: string;
    amount?: number;
    currency?: string;
    old_value?: string | number;
    new_value?: string | number;
    rating?: number;
  };
}

interface ActivityTabProps {
  listingId: string;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ listingId }) => {
  const [filter, setFilter] = useState<'all' | ActivityType>('all');

  // Fetch events from API
  const {
    data: eventsData,
    isLoading,
    error,
  } = useListingEvents(listingId ? parseInt(listingId) : undefined);

  // Transform API events to Activity format
  const displayActivities = useMemo(() => {
    const results = eventsData?.results ?? [];

    return results.map((event: ListingEvent): Activity => {
      // Map API event_type to local ActivityType
      let type: ActivityType;
      let title: string;
      let description: string;

      switch (event.event_type) {
        case 'VIEW':
          type = 'listing_viewed';
          title = 'Listing Viewed';
          description = event.metadata?.user_name
            ? `Viewed by ${event.metadata.user_name}`
            : 'Your listing was viewed';
          break;
        case 'ENQUIRY':
          type = 'message_received';
          title = 'New Enquiry';
          description = event.metadata?.user_name
            ? `${event.metadata.user_name} sent an enquiry`
            : 'New enquiry received';
          break;
        case 'BOOKING_REQUEST':
          type = 'request_received';
          title = 'Booking Request';
          description = event.metadata?.user_name
            ? `${event.metadata.user_name} requested to book`
            : 'New booking request received';
          break;
        case 'BOOKING_CONFIRMED':
          type = 'booking_created';
          title = 'Booking Confirmed';
          description = event.metadata?.user_name
            ? `${event.metadata.user_name} booking confirmed`
            : 'Booking confirmed';
          break;
        case 'WHATSAPP_CLICK':
          type = 'message_received';
          title = 'WhatsApp Contact';
          description = event.metadata?.user_name
            ? `${event.metadata.user_name} contacted via WhatsApp`
            : 'Contact via WhatsApp';
          break;
        default:
          type = 'listing_updated';
          title = 'Activity Logged';
          description = `Event: ${event.event_type}`;
      }

      return {
        id: String(event.id),
        type,
        timestamp: event.occurred_at,
        title,
        description,
        metadata: event.metadata || {},
      };
    });
  }, [eventsData]);

  // Fallback mock data for demonstration if no events
  const mockActivities: Activity[] = [
    {
      id: 'act-1',
      type: 'booking_created',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      title: 'New Booking Confirmed',
      description: 'James Anderson booked for Nov 18 - Nov 25',
      metadata: { user_name: 'James Anderson', amount: 840, currency: 'EUR' },
    },
    {
      id: 'act-2',
      type: 'message_received',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      title: 'New Message',
      description: 'Sarah Johnson sent you a message',
      metadata: { user_name: 'Sarah Johnson' },
    },
    {
      id: 'act-3',
      type: 'request_received',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      title: 'Booking Request',
      description: 'Michael Brown requested to book Dec 15 - Dec 22',
      metadata: { user_name: 'Michael Brown', amount: 840, currency: 'EUR' },
    },
    {
      id: 'act-4',
      type: 'review_received',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      title: 'New Review',
      description: 'David Chen left a 5-star review',
      metadata: { user_name: 'David Chen', rating: 5 },
    },
    {
      id: 'act-5',
      type: 'price_updated',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      title: 'Price Updated',
      description: 'Base price changed',
      metadata: { old_value: 110, new_value: 120, currency: 'EUR' },
    },
    {
      id: 'act-6',
      type: 'listing_viewed',
      timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
      title: 'Listing Viewed',
      description: 'Your listing was viewed 45 times today',
    },
    {
      id: 'act-7',
      type: 'date_blocked',
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      title: 'Dates Blocked',
      description: 'Blocked Dec 24 - Dec 26 for maintenance',
    },
    {
      id: 'act-8',
      type: 'request_approved',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      title: 'Request Approved',
      description: 'Approved booking request from Emma Wilson',
      metadata: { user_name: 'Emma Wilson', amount: 840, currency: 'EUR' },
    },
    {
      id: 'act-9',
      type: 'listing_updated',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      title: 'Listing Updated',
      description: 'Updated amenities and description',
    },
    {
      id: 'act-10',
      type: 'photo_added',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      title: 'Photos Added',
      description: 'Added 5 new photos to listing',
    },
    {
      id: 'act-11',
      type: 'booking_cancelled',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      title: 'Booking Cancelled',
      description: 'Robert Johnson cancelled their booking',
      metadata: { user_name: 'Robert Johnson' },
    },
    {
      id: 'act-12',
      type: 'request_declined',
      timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
      title: 'Request Declined',
      description: 'Declined booking request from Sophie Martin',
      metadata: { user_name: 'Sophie Martin' },
    },
  ];

  // Use real data if available, otherwise fallback to mock for demo
  const finalActivities = displayActivities.length > 0 ? displayActivities : mockActivities;

  const filteredActivities = filter === 'all'
    ? finalActivities
    : finalActivities.filter(act => act.type === filter);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lime-600 mx-auto" />
          <p className="mt-4 text-slate-700 font-medium">Loading activity...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="max-w-md text-center p-8 bg-white rounded-2xl border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to Load Activity</h3>
          <p className="text-slate-600 text-sm">
            {error instanceof Error ? error.message : 'An error occurred while loading activity.'}
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      const diffWeeks = Math.floor(diffDays / 7);
      return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    }
  };

  const getActivityConfig = (type: ActivityType) => {
    const configs = {
      booking_created: {
        icon: Calendar,
        color: 'lime',
        bgColor: 'from-lime-100 to-emerald-100',
        borderColor: 'border-lime-300',
        iconBg: 'bg-lime-600',
      },
      booking_cancelled: {
        icon: XCircle,
        color: 'red',
        bgColor: 'from-red-100 to-rose-100',
        borderColor: 'border-red-300',
        iconBg: 'bg-red-600',
      },
      message_received: {
        icon: MessageSquare,
        color: 'blue',
        bgColor: 'from-blue-100 to-indigo-100',
        borderColor: 'border-blue-300',
        iconBg: 'bg-blue-600',
      },
      request_received: {
        icon: Calendar,
        color: 'amber',
        bgColor: 'from-amber-100 to-orange-100',
        borderColor: 'border-amber-300',
        iconBg: 'bg-amber-600',
      },
      request_approved: {
        icon: CheckCircle,
        color: 'emerald',
        bgColor: 'from-emerald-100 to-teal-100',
        borderColor: 'border-emerald-300',
        iconBg: 'bg-emerald-600',
      },
      request_declined: {
        icon: XCircle,
        color: 'slate',
        bgColor: 'from-slate-100 to-gray-100',
        borderColor: 'border-slate-300',
        iconBg: 'bg-slate-600',
      },
      price_updated: {
        icon: DollarSign,
        color: 'purple',
        bgColor: 'from-purple-100 to-pink-100',
        borderColor: 'border-purple-300',
        iconBg: 'bg-purple-600',
      },
      listing_updated: {
        icon: Edit,
        color: 'indigo',
        bgColor: 'from-indigo-100 to-blue-100',
        borderColor: 'border-indigo-300',
        iconBg: 'bg-indigo-600',
      },
      listing_viewed: {
        icon: Eye,
        color: 'cyan',
        bgColor: 'from-cyan-100 to-sky-100',
        borderColor: 'border-cyan-300',
        iconBg: 'bg-cyan-600',
      },
      review_received: {
        icon: Star,
        color: 'yellow',
        bgColor: 'from-yellow-100 to-amber-100',
        borderColor: 'border-yellow-300',
        iconBg: 'bg-yellow-600',
      },
      date_blocked: {
        icon: Lock,
        color: 'slate',
        bgColor: 'from-slate-100 to-gray-100',
        borderColor: 'border-slate-300',
        iconBg: 'bg-slate-600',
      },
      date_unblocked: {
        icon: Unlock,
        color: 'lime',
        bgColor: 'from-lime-100 to-emerald-100',
        borderColor: 'border-lime-300',
        iconBg: 'bg-lime-600',
      },
      photo_added: {
        icon: ImageIcon,
        color: 'pink',
        bgColor: 'from-pink-100 to-rose-100',
        borderColor: 'border-pink-300',
        iconBg: 'bg-pink-600',
      },
    };

    return configs[type];
  };

  const activityTypeCounts = {
    all: finalActivities.length,
    booking_created: finalActivities.filter(a => a.type === 'booking_created').length,
    message_received: finalActivities.filter(a => a.type === 'message_received').length,
    request_received: finalActivities.filter(a => a.type === 'request_received').length,
    review_received: finalActivities.filter(a => a.type === 'review_received').length,
    price_updated: finalActivities.filter(a => a.type === 'price_updated').length,
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-lime-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Activity
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'all' ? 'bg-white/20' : 'bg-slate-100'
            }`}>
              {activityTypeCounts.all}
            </span>
          </button>
          <button
            onClick={() => setFilter('booking_created')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'booking_created'
                ? 'bg-lime-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Bookings
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'booking_created' ? 'bg-white/20' : 'bg-lime-100 text-lime-700'
            }`}>
              {activityTypeCounts.booking_created}
            </span>
          </button>
          <button
            onClick={() => setFilter('message_received')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'message_received'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Messages
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'message_received' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
            }`}>
              {activityTypeCounts.message_received}
            </span>
          </button>
          <button
            onClick={() => setFilter('request_received')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'request_received'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Requests
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'request_received' ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
            }`}>
              {activityTypeCounts.request_received}
            </span>
          </button>
          <button
            onClick={() => setFilter('review_received')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'review_received'
                ? 'bg-yellow-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Reviews
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'review_received' ? 'bg-white/20' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {activityTypeCounts.review_received}
            </span>
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-900">No {filter !== 'all' ? filter.replace('_', ' ') : ''} activity</p>
          <p className="text-xs text-slate-500 mt-1">Activity will appear here as it happens</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => {
            const config = getActivityConfig(activity.type);
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className={`p-6 bg-gradient-to-r ${config.bgColor} border-b ${config.borderColor}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-1">{activity.title}</h3>
                          <p className="text-sm text-slate-700">{activity.description}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>

                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {activity.metadata.user_name && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-slate-200">
                              <User className="h-3 w-3 text-slate-600" />
                              <span className="text-xs font-medium text-slate-700">
                                {activity.metadata.user_name}
                              </span>
                            </div>
                          )}

                          {activity.metadata.amount !== undefined && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-slate-200">
                              <DollarSign className="h-3 w-3 text-slate-600" />
                              <span className="text-xs font-medium text-slate-700">
                                {activity.metadata.currency} {activity.metadata.amount}
                              </span>
                            </div>
                          )}

                          {activity.metadata.rating !== undefined && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-slate-200">
                              <Star className="h-3 w-3 text-yellow-600 fill-yellow-600" />
                              <span className="text-xs font-medium text-slate-700">
                                {activity.metadata.rating}/5
                              </span>
                            </div>
                          )}

                          {activity.metadata.old_value !== undefined && activity.metadata.new_value !== undefined && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-slate-200">
                              <span className="text-xs text-slate-600">
                                {activity.metadata.currency} {activity.metadata.old_value}
                              </span>
                              <span className="text-xs text-slate-400">→</span>
                              <span className="text-xs font-medium text-lime-700">
                                {activity.metadata.currency} {activity.metadata.new_value}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
