/**
 * EmptyState Component
 *
 * Reusable empty state with icon, message, and CTAs
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  primaryAction,
  secondaryAction,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-slate-100">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {title}
      </h3>

      <p className="text-sm text-slate-600 max-w-md mb-6">
        {message}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              className="bg-lime-600 hover:bg-lime-700 text-white"
            >
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
