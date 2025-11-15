/**
 * TypeSummary Component
 *
 * Displays a one-line summary of key metrics for a specific listing type
 */

import React from 'react';
import { ListingTypeCode } from '../types';

interface TypeSummaryData {
  active: number;
  total: number;

  // Type-specific metrics
  // Daily Rental:
  booked_this_month?: number;
  pending_requests?: number;

  // Long-term:
  rented?: number;
  pending_applications?: number;

  // Sale:
  under_offer?: number;
  offers_received?: number;
  viewing_requests?: number;

  // Project:
  enquiries?: number;
  available_units?: number;
  total_units?: number;
}

interface TypeSummaryProps {
  type: ListingTypeCode;
  data: TypeSummaryData;
  isLoading?: boolean;
}

export const TypeSummary: React.FC<TypeSummaryProps> = ({ type, data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="h-6 bg-slate-200 rounded animate-pulse w-3/4" />
      </div>
    );
  }

  // Build summary text based on listing type
  const getSummaryText = (): string => {
    const parts: string[] = [];

    switch (type) {
      case 'DAILY_RENTAL':
        parts.push(`${data.active} active`);
        if (data.booked_this_month !== undefined) {
          parts.push(`${data.booked_this_month} booked this month`);
        }
        if (data.pending_requests !== undefined && data.pending_requests > 0) {
          parts.push(`${data.pending_requests} pending request${data.pending_requests !== 1 ? 's' : ''}`);
        }
        break;

      case 'LONG_TERM_RENTAL':
        parts.push(`${data.active} active`);
        if (data.rented !== undefined) {
          parts.push(`${data.rented} rented`);
        }
        if (data.pending_applications !== undefined && data.pending_applications > 0) {
          parts.push(`${data.pending_applications} pending application${data.pending_applications !== 1 ? 's' : ''}`);
        }
        break;

      case 'SALE':
        parts.push(`${data.active} active`);
        if (data.under_offer !== undefined && data.under_offer > 0) {
          parts.push(`${data.under_offer} under offer`);
        }
        if (data.viewing_requests !== undefined && data.viewing_requests > 0) {
          parts.push(`${data.viewing_requests} viewing request${data.viewing_requests !== 1 ? 's' : ''}`);
        }
        if (data.offers_received !== undefined && data.offers_received > 0) {
          parts.push(`${data.offers_received} offer${data.offers_received !== 1 ? 's' : ''} received`);
        }
        break;

      case 'PROJECT':
        parts.push(`${data.active} active project${data.active !== 1 ? 's' : ''}`);
        if (data.available_units !== undefined && data.total_units !== undefined) {
          parts.push(`${data.available_units}/${data.total_units} units available`);
        }
        if (data.enquiries !== undefined && data.enquiries > 0) {
          parts.push(`${data.enquiries} enquir${data.enquiries !== 1 ? 'ies' : 'y'}`);
        }
        break;
    }

    return parts.join(' | ');
  };

  const summaryText = getSummaryText();

  // Get icon based on type
  const getIcon = (): string => {
    switch (type) {
      case 'DAILY_RENTAL':
        return '🏖️';
      case 'LONG_TERM_RENTAL':
        return '🏠';
      case 'SALE':
        return '🏘️';
      case 'PROJECT':
        return '🏗️';
      default:
        return '📊';
    }
  };

  return (
    <div className="bg-gradient-to-r from-lime-50 to-emerald-50 border border-lime-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getIcon()}</span>
        <p className="text-sm font-medium text-slate-700">
          {summaryText || 'No listings yet'}
        </p>
      </div>
    </div>
  );
};

/**
 * Example usage:
 *
 * // Daily Rental
 * <TypeSummary
 *   type="DAILY_RENTAL"
 *   data={{
 *     active: 24,
 *     total: 28,
 *     booked_this_month: 18,
 *     pending_requests: 5
 *   }}
 * />
 * // Displays: "🏖️ 24 active | 18 booked this month | 5 pending requests"
 *
 * // Long-term Rental
 * <TypeSummary
 *   type="LONG_TERM_RENTAL"
 *   data={{
 *     active: 12,
 *     total: 15,
 *     rented: 8,
 *     pending_applications: 3
 *   }}
 * />
 * // Displays: "🏠 12 active | 8 rented | 3 pending applications"
 *
 * // Sale
 * <TypeSummary
 *   type="SALE"
 *   data={{
 *     active: 6,
 *     total: 8,
 *     under_offer: 2,
 *     viewing_requests: 5,
 *     offers_received: 3
 *   }}
 * />
 * // Displays: "🏘️ 6 active | 2 under offer | 5 viewing requests | 3 offers received"
 *
 * // Project
 * <TypeSummary
 *   type="PROJECT"
 *   data={{
 *     active: 2,
 *     total: 2,
 *     total_units: 50,
 *     available_units: 12,
 *     enquiries: 24
 *   }}
 * />
 * // Displays: "🏗️ 2 active projects | 12/50 units available | 24 enquiries"
 */
