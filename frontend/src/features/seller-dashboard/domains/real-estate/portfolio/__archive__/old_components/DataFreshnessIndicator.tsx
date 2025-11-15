/**
 * DataFreshnessIndicator Component
 *
 * Shows when data was last updated and provides manual refresh
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface DataFreshnessIndicatorProps {
  lastUpdated?: Date;
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  lastUpdated = new Date(),
  onRefresh,
  isRefreshing = false,
  className = '',
}) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000); // seconds

      if (diff < 60) {
        setTimeAgo('Just now');
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        setTimeAgo(`${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`);
      } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        setTimeAgo(`${hours} ${hours === 1 ? 'hour' : 'hours'} ago`);
      } else {
        const days = Math.floor(diff / 86400);
        setTimeAgo(`${days} ${days === 1 ? 'day' : 'days'} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className={`flex items-center gap-3 text-sm text-slate-600 ${className}`}>
      <span>Updated {timeAgo}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-7 px-2 hover:bg-slate-100"
        title="Refresh data"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};
