/**
 * ListingCard - Base Component
 *
 * Common card layout for all listing types with customizable content
 */

import React from 'react';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ListingCardAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
}

export interface ListingCardProps {
  // Image
  imageUrl?: string;
  imageFallback?: string;

  // Header
  title: string;
  subtitle?: string;
  price: string;
  priceLabel?: string;

  // Status badge
  status: {
    label: string;
    variant: 'active' | 'inactive' | 'success' | 'warning' | 'info';
  };

  // Metrics (clickable items)
  metrics: Array<{
    icon: string;
    label: string;
    onClick?: () => void;
    highlight?: boolean;
  }>;

  // Primary actions (buttons at bottom)
  primaryActions: ListingCardAction[];

  // Menu actions (dropdown)
  menuActions: ListingCardAction[];

  // Card click handler (navigates to detail page)
  onCardClick?: () => void;

  // Additional content
  children?: React.ReactNode;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  imageUrl,
  imageFallback = 'No Image',
  title,
  subtitle,
  price,
  priceLabel,
  status,
  metrics,
  primaryActions,
  menuActions,
  onCardClick,
  children,
}) => {
  const getStatusColor = (variant: string) => {
    switch (variant) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'success':
        return 'bg-lime-100 text-lime-700 border-lime-200';
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'info':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getActionVariantClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-lg hover:shadow-xl';
      case 'danger':
        return 'bg-rose-100 text-rose-700 hover:bg-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group ${onCardClick ? 'cursor-pointer' : ''}`}
      onClick={onCardClick ? (e) => {
        // Only trigger if clicking on the card itself, not on buttons/metrics
        if ((e.target as HTMLElement).closest('button, a')) return;
        onCardClick();
      } : undefined}
    >
      {/* Image */}
      <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            {imageFallback}
          </div>
        )}

        {/* Menu (top right) */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm transition-colors">
                <MoreVertical className="h-4 w-4 text-slate-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {menuActions.map((action, index) => (
                <React.Fragment key={index}>
                  <DropdownMenuItem
                    onClick={action.onClick}
                    className={`cursor-pointer ${
                      action.variant === 'danger' ? 'text-rose-600 focus:text-rose-700' : ''
                    }`}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    <span className="text-sm">{action.label}</span>
                  </DropdownMenuItem>
                  {index < menuActions.length - 1 && action.variant === 'danger' && (
                    <DropdownMenuSeparator />
                  )}
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Price */}
        <div className="mb-3">
          <h3 className="font-semibold text-slate-900 text-base line-clamp-1" title={title}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
          <div className="mt-1.5">
            <p className="text-lg font-bold text-lime-600">
              {price}
            </p>
            {priceLabel && (
              <p className="text-xs text-slate-500">{priceLabel}</p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              status.variant
            )}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status.label}
          </span>
        </div>

        {/* Metrics */}
        <div className="space-y-2 mb-4">
          {metrics.map((metric, index) => (
            <div key={index}>
              {metric.onClick ? (
                <button
                  onClick={metric.onClick}
                  className={`w-full text-left text-sm transition-colors ${
                    metric.highlight
                      ? 'text-lime-600 hover:text-lime-700 font-medium'
                      : 'text-slate-700 hover:text-lime-600'
                  }`}
                >
                  <span className="mr-2">{metric.icon}</span>
                  {metric.label}
                </button>
              ) : (
                <div className="text-sm text-slate-700">
                  <span className="mr-2">{metric.icon}</span>
                  {metric.label}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Custom content */}
        {children}

        {/* Primary Actions */}
        <div className={`flex gap-2 ${primaryActions.length > 2 ? 'flex-col sm:flex-row' : ''}`}>
          {primaryActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${getActionVariantClass(
                action.variant
              )}`}
            >
              {action.icon && <span className="mr-1.5">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
