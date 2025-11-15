/**
 * TimeScopeIndicator Component
 *
 * Displays the current time scope/period as a chip
 */

import React from 'react';
import { Calendar } from 'lucide-react';

interface TimeScopeIndicatorProps {
  timePeriod: '30d' | '90d' | '1y';
  className?: string;
}

const TIME_PERIOD_LABELS = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y': 'Last year',
};

export const TimeScopeIndicator: React.FC<TimeScopeIndicatorProps> = ({
  timePeriod,
  className = "",
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-700 ${className}`}>
      <Calendar className="h-3 w-3" />
      <span>{TIME_PERIOD_LABELS[timePeriod]}</span>
    </div>
  );
};
