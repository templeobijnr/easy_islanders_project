/**
 * Domain Metrics Card - Displays domain-specific performance metrics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { DomainMetrics } from '../hooks/useDomainMetrics';

const DOMAIN_CONFIG = {
  real_estate: {
    icon: '🏠',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
    label: 'Real Estate',
  },
  events: {
    icon: '🎉',
    color: 'bg-pink-100',
    textColor: 'text-pink-700',
    label: 'Events',
  },
  activities: {
    icon: '⚡',
    color: 'bg-amber-100',
    textColor: 'text-amber-700',
    label: 'Activities',
  },
  appointments: {
    icon: '⏰',
    color: 'bg-purple-100',
    textColor: 'text-purple-700',
    label: 'Appointments',
  },
};

interface DomainMetricsCardProps {
  metrics: DomainMetrics;
}

export const DomainMetricsCard: React.FC<DomainMetricsCardProps> = ({ metrics }) => {
  const config = DOMAIN_CONFIG[metrics.domain as keyof typeof DOMAIN_CONFIG] || {
    icon: '📊',
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
    label: metrics.domain,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={`text-2xl ${config.color} rounded px-2 py-1`}>
            {config.icon}
          </span>
          <span className={config.textColor}>{config.label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Listings */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Listings</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{metrics.total_listings}</span>
              <span className="text-xs text-gray-500">
                ({metrics.active_listings} active)
              </span>
            </div>
          </div>

          {/* Bookings */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Bookings</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{metrics.total_bookings}</span>
              <span className="text-xs text-gray-500">
                ({metrics.confirmed_bookings} confirmed)
              </span>
            </div>
          </div>

          {/* Revenue */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Revenue</span>
            <span className="font-bold text-lg">
              ${metrics.revenue.toFixed(2)}
            </span>
          </div>

          {/* Booking Rate */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Booking Rate</span>
            <span className="font-bold">
              {(metrics.booking_rate * 100).toFixed(1)}%
            </span>
          </div>

          {/* Rating */}
          {metrics.avg_rating !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Rating</span>
              <span className="font-bold">
                {metrics.avg_rating.toFixed(1)} ⭐
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">Capacity Utilization</span>
              <span className="text-xs font-semibold">
                {metrics.total_listings > 0
                  ? Math.round((metrics.confirmed_bookings / Math.max(metrics.total_bookings, 1)) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${config.color}`}
                style={{
                  width: `${
                    metrics.total_listings > 0
                      ? Math.round((metrics.confirmed_bookings / Math.max(metrics.total_bookings, 1)) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
