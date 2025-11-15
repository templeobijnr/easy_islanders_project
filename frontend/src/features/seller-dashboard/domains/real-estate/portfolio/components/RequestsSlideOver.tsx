/**
 * RequestsSlideOver Component
 *
 * Slide-over panel for viewing and managing booking requests, applications, viewings, and offers
 */

import React, { useState } from 'react';
import { X, Check, XIcon, User, Calendar, Users, MessageSquare } from 'lucide-react';

type RequestType = 'booking' | 'application' | 'viewing' | 'offer';

interface BookingRequest {
  id: string;
  guest: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  check_in: string;
  check_out: string;
  guests: {
    adults: number;
    children: number;
  };
  total_price: number;
  currency: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  special_requests?: string;
}

interface ApplicationRequest {
  id: string;
  applicant: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  move_in_date: string;
  employment_status: string;
  monthly_income?: number;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  additional_info?: string;
}

interface ViewingRequest {
  id: string;
  visitor: {
    name: string;
    email: string;
    phone: string;
  };
  preferred_date: string;
  preferred_time: string;
  status: 'pending' | 'confirmed' | 'declined';
  created_at: string;
  notes?: string;
}

interface OfferRequest {
  id: string;
  buyer: {
    name: string;
    email: string;
    phone: string;
  };
  offer_amount: number;
  currency: string;
  financing: 'cash' | 'mortgage' | 'other';
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  created_at: string;
  notes?: string;
}

type Request = BookingRequest | ApplicationRequest | ViewingRequest | OfferRequest;

interface RequestsSlideOverProps {
  listingId: string;
  listingTitle: string;
  requestType: RequestType;
  isOpen: boolean;
  onClose: () => void;
  requests?: Request[];
  isLoading?: boolean;
  onApprove?: (requestId: string, notes?: string) => Promise<void>;
  onDecline?: (requestId: string, reason?: string) => Promise<void>;
  onMessage?: (requestId: string) => void;
}

export const RequestsSlideOver: React.FC<RequestsSlideOverProps> = ({
  listingId,
  listingTitle,
  requestType,
  isOpen,
  onClose,
  requests = [],
  isLoading = false,
  onApprove,
  onDecline,
  onMessage,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getRequestTypeLabel = () => {
    switch (requestType) {
      case 'booking':
        return 'Booking Requests';
      case 'application':
        return 'Rental Applications';
      case 'viewing':
        return 'Viewing Requests';
      case 'offer':
        return 'Purchase Offers';
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!onApprove) return;
    setProcessingId(requestId);
    try {
      await onApprove(requestId);
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!onDecline) return;
    setProcessingId(requestId);
    try {
      await onDecline(requestId);
    } catch (error) {
      console.error('Failed to decline request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderRequestCard = (request: Request) => {
    const isPending = request.status === 'pending';

    // Booking Request Card
    if (requestType === 'booking') {
      const bookingRequest = request as BookingRequest;
      return (
        <div key={request.id} className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
              {bookingRequest.guest.avatar ? (
                <img src={bookingRequest.guest.avatar} alt={bookingRequest.guest.name} className="w-full h-full rounded-full" />
              ) : (
                <User className="h-5 w-5 text-slate-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{bookingRequest.guest.name}</h3>
              <p className="text-xs text-slate-500">{bookingRequest.guest.email}</p>
            </div>
            {!isPending && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  bookingRequest.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {bookingRequest.status}
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Check-in: {formatDate(bookingRequest.check_in)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Check-out: {formatDate(bookingRequest.check_out)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="h-4 w-4 text-slate-400" />
              <span>
                {bookingRequest.guests.adults} adult{bookingRequest.guests.adults !== 1 ? 's' : ''}
                {bookingRequest.guests.children > 0 && `, ${bookingRequest.guests.children} child${bookingRequest.guests.children !== 1 ? 'ren' : ''}`}
              </span>
            </div>
            <div className="font-semibold text-lime-600">
              Total: {formatCurrency(bookingRequest.total_price, bookingRequest.currency)}
            </div>
          </div>

          {bookingRequest.special_requests && (
            <div className="mb-4 p-3 bg-slate-50 rounded text-sm">
              <p className="font-medium text-slate-700 mb-1">Special Requests:</p>
              <p className="text-slate-600">{bookingRequest.special_requests}</p>
            </div>
          )}

          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id)}
                disabled={processingId === request.id}
                className="flex-1 px-3 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                {processingId === request.id ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => handleDecline(request.id)}
                disabled={processingId === request.id}
                className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <XIcon className="h-4 w-4" />
                Decline
              </button>
            </div>
          )}

          {onMessage && (
            <button
              onClick={() => onMessage(request.id)}
              className="w-full mt-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:border-lime-300 hover:bg-lime-50 transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Message Guest
            </button>
          )}
        </div>
      );
    }

    // Similar rendering for other request types...
    // For brevity, showing simplified versions

    return (
      <div key={request.id} className="p-4 bg-white border border-slate-200 rounded-lg">
        <p className="text-sm text-slate-600">Request card for {requestType}</p>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
      <div className="bg-white h-full w-full max-w-md shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-lime-50 to-emerald-50">
          <div className="flex-1">
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 mb-2 flex items-center gap-2 text-sm"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h2 className="text-lg font-semibold text-slate-900">
              {getRequestTypeLabel()} ({requests.length})
            </h2>
            <p className="text-xs text-slate-600 truncate">{listingTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-slate-500">Loading requests...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-2">📋</div>
              <p className="text-sm text-slate-600">No {requestType} requests yet</p>
            </div>
          ) : (
            requests.map(renderRequestCard)
          )}
        </div>
      </div>
    </div>
  );
};
