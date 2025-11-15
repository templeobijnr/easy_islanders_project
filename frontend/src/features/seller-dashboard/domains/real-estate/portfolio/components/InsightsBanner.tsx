/**
 * InsightsBanner Component
 *
 * Displays auto-generated insights and actionable intelligence
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, ArrowRight } from 'lucide-react';

export type InsightType = 'positive' | 'warning' | 'neutral' | 'opportunity';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface InsightsBannerProps {
  insights: Insight[];
  onDismiss?: (insightId: string) => void;
  className?: string;
}

export const InsightsBanner: React.FC<InsightsBannerProps> = ({
  insights,
  onDismiss,
  className = '',
}) => {
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  const handleDismiss = (insightId: string) => {
    setDismissedInsights((prev) => new Set(prev).add(insightId));
    onDismiss?.(insightId);
  };

  const visibleInsights = insights.filter((insight) => !dismissedInsights.has(insight.id));

  if (visibleInsights.length === 0) {
    return null;
  }

  const getInsightStyle = (type: InsightType) => {
    switch (type) {
      case 'positive':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          icon: TrendingUp,
          iconColor: 'text-emerald-600',
          textColor: 'text-emerald-900',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          textColor: 'text-amber-900',
        };
      case 'opportunity':
        return {
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          icon: Lightbulb,
          iconColor: 'text-sky-600',
          textColor: 'text-sky-900',
        };
      case 'neutral':
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          icon: TrendingDown,
          iconColor: 'text-slate-600',
          textColor: 'text-slate-900',
        };
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleInsights.map((insight) => {
        const style = getInsightStyle(insight.type);
        const Icon = style.icon;

        return (
          <div
            key={insight.id}
            className={`${style.bg} ${style.border} border rounded-xl p-4 transition-all hover:shadow-sm`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <Icon className={`h-5 w-5 ${style.iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold ${style.textColor}`}>
                  {insight.title}
                </h4>
                <p className={`text-sm ${style.textColor} opacity-90 mt-1`}>
                  {insight.description}
                </p>

                {/* Action Button */}
                {insight.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={insight.action.onClick}
                    className={`mt-3 h-8 px-3 ${style.textColor} hover:bg-white/50`}
                  >
                    {insight.action.label}
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                )}
              </div>

              {/* Dismiss Button */}
              {onDismiss && (
                <button
                  onClick={() => handleDismiss(insight.id)}
                  className={`flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors ${style.iconColor} opacity-50 hover:opacity-100`}
                  aria-label="Dismiss insight"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Example usage:
 *
 * const insights: Insight[] = [
 *   {
 *     id: '1',
 *     type: 'positive',
 *     title: 'Occupancy is up 12% this month',
 *     description: '3 listings are driving this growth: Kyrenia Villa, Nicosia Apartment, Famagusta Studio.',
 *     action: {
 *       label: 'View top performers',
 *       onClick: () => setActiveFilter('high-performers'),
 *     },
 *   },
 *   {
 *     id: '2',
 *     type: 'warning',
 *     title: '5 listings have incomplete information',
 *     description: 'Listings with complete details get 3x more enquiries on average.',
 *     action: {
 *       label: 'Fix now',
 *       onClick: () => setActiveFilter('needs-attention'),
 *     },
 *   },
 *   {
 *     id: '3',
 *     type: 'opportunity',
 *     title: 'Summer pricing opportunity',
 *     description: 'Similar properties are increasing prices by 15-20% for July-August.',
 *     action: {
 *       label: 'Adjust pricing',
 *       onClick: () => handleBulkPricing(),
 *     },
 *   },
 * ];
 *
 * <InsightsBanner
 *   insights={insights}
 *   onDismiss={(id) => localStorage.setItem(`insight-dismissed-${id}`, 'true')}
 * />
 */
