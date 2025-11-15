/**
 * BulkActionTemplates Component
 *
 * Pre-configured bulk operation templates for common tasks
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Home,
  Zap,
  ChevronDown,
} from 'lucide-react';

export interface BulkTemplate {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: 'status' | 'pricing' | 'availability' | 'settings';
}

interface BulkActionTemplatesProps {
  templates: BulkTemplate[];
  disabled?: boolean;
  className?: string;
}

export const BulkActionTemplates: React.FC<BulkActionTemplatesProps> = ({
  templates,
  disabled = false,
  className = '',
}) => {
  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, BulkTemplate[]>);

  const categoryLabels: Record<string, string> = {
    status: 'Status Templates',
    pricing: 'Pricing Templates',
    availability: 'Availability Templates',
    settings: 'Settings Templates',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={`h-8 ${className}`}
        >
          <Zap className="h-4 w-4 mr-1.5" />
          Quick actions
          <ChevronDown className="h-3.5 w-3.5 ml-1.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase">
          Quick Actions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.entries(groupedTemplates).map(([category, categoryTemplates], categoryIndex) => (
          <React.Fragment key={category}>
            {categoryIndex > 0 && <DropdownMenuSeparator />}

            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-slate-600 mb-1">
                {categoryLabels[category] || category}
              </p>
            </div>

            {categoryTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <DropdownMenuItem
                  key={template.id}
                  onClick={template.action}
                  className="cursor-pointer"
                >
                  <Icon className="h-4 w-4 mr-2 text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{template.label}</span>
                    <span className="text-xs text-slate-500">{template.description}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Default templates for common operations
 */
export const DEFAULT_BULK_TEMPLATES: Omit<BulkTemplate, 'action'>[] = [
  {
    id: 'mark-rented',
    label: 'Mark as Rented',
    description: 'Set status to Occupied',
    icon: CheckCircle,
    category: 'status',
  },
  {
    id: 'mark-available',
    label: 'Mark as Available',
    description: 'Set status to Vacant',
    icon: Home,
    category: 'status',
  },
  {
    id: 'deactivate',
    label: 'Deactivate All',
    description: 'Set status to Inactive',
    icon: XCircle,
    category: 'status',
  },
  {
    id: 'summer-pricing',
    label: 'Summer Pricing',
    description: 'Increase prices by 20%',
    icon: DollarSign,
    category: 'pricing',
  },
  {
    id: 'winter-discount',
    label: 'Winter Discount',
    description: 'Decrease prices by 15%',
    icon: DollarSign,
    category: 'pricing',
  },
  {
    id: 'block-dates',
    label: 'Block Dates',
    description: 'Set unavailable for selected period',
    icon: Calendar,
    category: 'availability',
  },
  {
    id: 'open-bookings',
    label: 'Open All Bookings',
    description: 'Make available for booking',
    icon: Calendar,
    category: 'availability',
  },
];

/**
 * Example usage:
 *
 * const templates: BulkTemplate[] = DEFAULT_BULK_TEMPLATES.map((template) => ({
 *   ...template,
 *   action: () => {
 *     switch (template.id) {
 *       case 'mark-rented':
 *         handleBulkStatusChange('OCCUPIED');
 *         break;
 *       case 'summer-pricing':
 *         handleBulkPriceAdjust(1.2);
 *         break;
 *       // ... handle other templates
 *     }
 *   },
 * }));
 *
 * <BulkActionTemplates
 *   templates={templates}
 *   disabled={selectedListings.length === 0}
 * />
 */
