/**
 * HostProfile - Displays host/seller information for a listing
 * Shows profile, verification status, stats, and contact options
 */

import React from 'react';
import { Shield, Star, MessageCircle, MapPin, Calendar, Award } from 'lucide-react';

// Mock host type (TODO: Move to types.ts when backend is ready)
export interface Host {
  id: string;
  username: string;
  full_name?: string;
  avatar?: string;
  bio?: string;
  joined_date: string;
  is_verified: boolean;
  is_superhost?: boolean;
  stats: {
    total_listings: number;
    completed_bookings: number;
    response_rate: number;
    response_time: string; // e.g., "within 1 hour"
    rating: number;
    reviews_count: number;
  };
  location?: string;
  languages?: string[];
}

interface HostProfileProps {
  host: Host;
  onContactHost?: () => void;
  className?: string;
}

// Format date (e.g., "Joined January 2023")
const formatJoinDate = (dateString: string): string => {
  const date = new Date(dateString);
  const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return `Joined ${monthYear}`;
};

// Get initials from username/name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const HostProfile: React.FC<HostProfileProps> = ({
  host,
  onContactHost,
  className = '',
}) => {
  const displayName = host.full_name || host.username;
  const initials = getInitials(displayName);

  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 pb-5 border-b border-slate-200">
        {/* Avatar */}
        <div className="relative">
          {host.avatar ? (
            <img
              src={host.avatar}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 text-white font-bold text-xl shadow-md">
              {initials}
            </div>
          )}

          {/* Verification Badge */}
          {host.is_verified && (
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-lime-600 rounded-full flex items-center justify-center shadow-md"
              title="Verified Host"
            >
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Name & Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-slate-900">{displayName}</h3>
            {host.is_superhost && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 border border-yellow-300 rounded-full"
                title="Superhost"
              >
                <Award className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-xs font-semibold text-yellow-700">Superhost</span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-600 mb-2">{formatJoinDate(host.joined_date)}</p>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-slate-900">{host.stats.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-slate-600">
              ({host.stats.reviews_count} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {host.bio && (
        <div className="mb-5 pb-5 border-b border-slate-200">
          <p className="text-slate-700 leading-relaxed">{host.bio}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-slate-200">
        <div>
          <div className="text-2xl font-bold text-slate-900">{host.stats.total_listings}</div>
          <div className="text-sm text-slate-600">Listings</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{host.stats.completed_bookings}</div>
          <div className="text-sm text-slate-600">Bookings</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{host.stats.response_rate}%</div>
          <div className="text-sm text-slate-600">Response Rate</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{host.stats.response_time}</div>
          <div className="text-sm text-slate-600">Response Time</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-3 mb-5">
        {/* Location */}
        {host.location && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span>{host.location}</span>
          </div>
        )}

        {/* Member Since */}
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>{formatJoinDate(host.joined_date)}</span>
        </div>

        {/* Languages */}
        {host.languages && host.languages.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <MessageCircle className="w-4 h-4 text-slate-500 mt-0.5" />
            <div>
              <span className="font-medium">Languages: </span>
              <span>{host.languages.join(', ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Contact Button */}
      {onContactHost && (
        <button
          onClick={onContactHost}
          className="w-full px-4 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-lime-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Contact Host</span>
        </button>
      )}

      {/* Verification Info */}
      {host.is_verified && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <Shield className="w-4 h-4 text-lime-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Verified Host: </span>
              <span>
                This host has confirmed their identity and contact information through our
                verification process.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Superhost Badge Info */}
      {host.is_superhost && (
        <div className="mt-3 flex items-start gap-2 text-xs text-slate-600">
          <Award className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900">Superhost: </span>
            <span>
              Experienced host with consistently high ratings and excellent customer service.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostProfile;
