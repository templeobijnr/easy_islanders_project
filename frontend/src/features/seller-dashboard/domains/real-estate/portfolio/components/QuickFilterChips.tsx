/**
 * QuickFilterChips Component
 *
 * Pre-configured filter views for common scenarios
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Star, FileText, CheckCircle } from 'lucide-react';

export type QuickFilterType = 'all' | 'needs-attention' | 'high-performers' | 'drafts' | 'active';

interface QuickFilterChipsProps {
  activeFilter: QuickFilterType;
  onFilterChange: (filter: QuickFilterType) => void;
  counts?: {
    all: number;
    needsAttention: number;
    highPerformers: number;
    drafts: number;
    active: number;
  };
  className?: string;
}

export const QuickFilterChips: React.FC<QuickFilterChipsProps> = ({
  activeFilter,
  onFilterChange,
  counts,
  className = '',
}) => {
  const filters = [
    {
      id: 'all' as QuickFilterType,
      label: 'All listings',
      icon: null,
      count: counts?.all,
    },
    {
      id: 'active' as QuickFilterType,
      label: 'Active',
      icon: CheckCircle,
      count: counts?.active,
    },
    {
      id: 'needs-attention' as QuickFilterType,
      label: 'Needs attention',
      icon: AlertTriangle,
      count: counts?.needsAttention,
      variant: 'warning' as const,
    },
    {
      id: 'high-performers' as QuickFilterType,
      label: 'High performers',
      icon: Star,
      count: counts?.highPerformers,
      variant: 'success' as const,
    },
    {
      id: 'drafts' as QuickFilterType,
      label: 'Drafts',
      icon: FileText,
      count: counts?.drafts,
    },
  ];

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className="text-sm font-medium text-slate-700 mr-2">Quick views:</span>

      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        const Icon = filter.icon;

        let buttonClasses = 'h-8';
        if (isActive) {
          if (filter.variant === 'warning') {
            buttonClasses += ' bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200';
          } else if (filter.variant === 'success') {
            buttonClasses += ' bg-emerald-100 border-emerald-300 text-emerald-900 hover:bg-emerald-200';
          } else {
            buttonClasses += ' bg-lime-100 border-lime-300 text-slate-900 hover:bg-lime-200';
          }
        } else {
          buttonClasses += ' bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
        }

        return (
          <Button
            key={filter.id}
            variant="outline"
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className={buttonClasses}
          >
            {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
            <span>{filter.label}</span>
            {typeof filter.count === 'number' && (
              <span className="ml-1.5 text-xs opacity-70">({filter.count})</span>
            )}
          </Button>
        );
      })}
    </div>
  );
};
