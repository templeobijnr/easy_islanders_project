/**
 * RequestsTab - Booking requests and applications management
 */

import React, { useState } from 'react';
import { Calendar, User, Clock, CheckCircle, XCircle, MessageSquare, DollarSign } from 'lucide-react';

interface BookingRequest {
  id: string;
  guest: {
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
  };
  check_in: string;
  check_out: string;
  guests_count: number;
  status: 'pending' | 'approved' | 'declined';
  total_price: number;
  currency: string;
  message?: string;
  created_at: string;
}

interface RequestsTabProps {
  listingId: string;
  requests?: BookingRequest[];
}

export const RequestsTab: React.FC<RequestsTabProps> = ({ listingId, requests = [] }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all');

  // Mock data if no requests provided
  const displayRequests: BookingRequest[] = requests.length > 0 ? requests : [
    {
      id: 'req-1',
      guest: {
        name: 'Michael Brown',
        email: 'michael@example.com',
        phone: '+90 555 123 4567',
      },
      check_in: '2025-12-15',
      check_out: '2025-12-22',
      guests_count: 4,
      status: 'pending',
      total_price: 840,
      currency: 'EUR',
      message: 'Hi! We are a family of 4 looking for a peaceful vacation. Can we bring our small dog?',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'req-2',
      guest: {
        name: 'Emma Wilson',
        email: 'emma@example.com',
      },
      check_in: '2025-11-20',
      check_out: '2025-11-27',
      guests_count: 2,
      status: 'pending',
      total_price: 840,
      currency: 'EUR',
      message: 'Looking forward to staying at your beautiful villa!',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'req-3',
      guest: {
        name: 'David Chen',
        email: 'david@example.com',
      },
      check_in: '2025-11-10',
      check_out: '2025-11-15',
      guests_count: 2,
      status: 'approved',
      total_price: 600,
      currency: 'EUR',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'req-4',
      guest: {
        name: 'Sophie Martin',
        email: 'sophie@example.com',
      },
      check_in: '2025-12-25',
      check_out: '2025-12-31',
      guests_count: 6,
      status: 'declined',
      total_price: 720,
      currency: 'EUR',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const filteredRequests = filter === 'all'
    ? displayRequests
    : displayRequests.filter(req => req.status === filter);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleApprove = (requestId: string) => {
    console.log('Approving request:', requestId);
  };

  const handleDecline = (requestId: string) => {
    console.log('Declining request:', requestId);
  };

  const handleMessage = (requestId: string) => {
    console.log('Messaging guest for request:', requestId);
  };

  const getStatusBadge = (status: BookingRequest['status']) => {
    const statusConfig = {
      pending: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: 'Pending',
        dot: 'bg-amber-600',
      },
      approved: {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'Approved',
        dot: 'bg-emerald-600',
      },
      declined: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        label: 'Declined',
        dot: 'bg-slate-600',
      },
    };

    const config = statusConfig[status];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text} border ${config.border}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  const stats = {
    all: displayRequests.length,
    pending: displayRequests.filter(r => r.status === 'pending').length,
    approved: displayRequests.filter(r => r.status === 'approved').length,
    declined: displayRequests.filter(r => r.status === 'declined').length,
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Requests
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'all' ? 'bg-white/20' : 'bg-slate-100'
            }`}>
              {stats.all}
            </span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pending
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'pending' ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
            }`}>
              {stats.pending}
            </span>
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Approved
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'approved' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {stats.approved}
            </span>
          </button>
          <button
            onClick={() => setFilter('declined')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === 'declined'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Declined
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'declined' ? 'bg-white/20' : 'bg-slate-100'
            }`}>
              {stats.declined}
            </span>
          </button>
        </div>
      </div>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-900">No {filter !== 'all' ? filter : ''} requests</p>
          <p className="text-xs text-slate-500 mt-1">Booking requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {/* Guest Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-200 to-emerald-200 flex items-center justify-center flex-shrink-0">
                      {request.guest.avatar ? (
                        <img
                          src={request.guest.avatar}
                          alt={request.guest.name}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <User className="h-6 w-6 text-brand-600" />
                      )}
                    </div>

                    {/* Guest Info */}
                    <div>
                      <h3 className="font-semibold text-slate-900">{request.guest.name}</h3>
                      <p className="text-sm text-slate-600">{request.guest.email}</p>
                      {request.guest.phone && (
                        <p className="text-xs text-slate-500 mt-0.5">{request.guest.phone}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(request.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {getStatusBadge(request.status)}
                  </div>
                </div>

                {/* Booking Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-brand-600" />
                      <p className="text-xs font-medium text-slate-700">Check-in</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(request.check_in)}</p>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-brand-600" />
                      <p className="text-xs font-medium text-slate-700">Check-out</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(request.check_out)}</p>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-brand-600" />
                      <p className="text-xs font-medium text-slate-700">Guests</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {request.guests_count} {request.guests_count === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-brand-600" />
                      <p className="text-xs font-medium text-slate-700">Total</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {request.currency} {request.total_price}
                      <span className="text-xs text-slate-600 ml-1">
                        ({calculateNights(request.check_in, request.check_out)} nights)
                      </span>
                    </p>
                  </div>
                </div>

                {/* Guest Message */}
                {request.message && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Guest Message
                    </p>
                    <p className="text-sm text-slate-700">{request.message}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {request.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecline(request.id)}
                        className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </button>
                      <button
                        onClick={() => handleMessage(request.id)}
                        className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleMessage(request.id)}
                      className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message Guest
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
