/**
 * EmptyState Component
 *
 * Context-aware empty state with icon, message, CTAs, and contextual hints
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon, FileText, PauseCircle } from 'lucide-react';

export interface ContextHint {
  label: string;
  count: number;
  onClick: () => void;
}

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
  contextHints?: ContextHint[];
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  primaryAction,
  secondaryAction,
  contextHints,
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

      {/* Context Hints - show what's available in other states */}
      {contextHints && contextHints.length > 0 && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-md">
          <p className="text-xs font-medium text-slate-700 mb-3">
            But you have listings in other states:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {contextHints.map((hint, index) => (
              <button
                key={index}
                onClick={hint.onClick}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:border-lime-300 hover:bg-lime-50 transition-colors"
              >
                <span className="font-medium text-slate-700">{hint.label}</span>
                <span className="ml-1.5 text-xs text-slate-500">({hint.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Primary and Secondary Actions */}
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
