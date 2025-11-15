/**
 * TabContextHeader Component
 *
 * Provides contextual information at the top of each tab
 */

import React from 'react';
import { TimeScopeIndicator } from './TimeScopeIndicator';

interface TabContextHeaderProps {
  title: string;
  description: string;
  timePeriod?: '30d' | '90d' | '1y';
  showTimePeriod?: boolean;
  className?: string;
}

export const TabContextHeader: React.FC<TabContextHeaderProps> = ({
  title,
  description,
  timePeriod,
  showTimePeriod = false,
  className = "",
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {showTimePeriod && timePeriod && (
          <TimeScopeIndicator timePeriod={timePeriod} />
        )}
      </div>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
};
