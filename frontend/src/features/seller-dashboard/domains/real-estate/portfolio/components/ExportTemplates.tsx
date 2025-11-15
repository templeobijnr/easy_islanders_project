/**
 * ExportTemplates Component
 *
 * Multiple export format options for listing data
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
  Download,
  FileSpreadsheet,
  FileText,
  FileBarChart,
  Image,
  ChevronDown,
} from 'lucide-react';

export interface ExportTemplate {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  format: 'csv' | 'xlsx' | 'pdf' | 'json' | 'png';
  onExport: () => void;
}

interface ExportTemplatesProps {
  templates: ExportTemplate[];
  currentFilterCount?: number;
  disabled?: boolean;
  className?: string;
}

export const ExportTemplates: React.FC<ExportTemplatesProps> = ({
  templates,
  currentFilterCount,
  disabled = false,
  className = '',
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={`h-10 ${className}`}
          title="Exports current filtered view"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
          <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Export Options
          </span>
          {currentFilterCount !== undefined && (
            <span className="text-xs text-slate-500 font-normal">
              {currentFilterCount} listing{currentFilterCount !== 1 ? 's' : ''}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <DropdownMenuItem
              key={template.id}
              onClick={template.onExport}
              className="cursor-pointer py-3"
            >
              <Icon className="h-4 w-4 mr-3 text-slate-500 flex-shrink-0" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{template.label}</span>
                  <span className="text-xs text-slate-400 uppercase ml-2">
                    {template.format}
                  </span>
                </div>
                <span className="text-xs text-slate-500 mt-0.5">
                  {template.description}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <p className="text-xs text-slate-500">
            Exports include only the currently filtered listings
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Default export templates
 */
export const DEFAULT_EXPORT_TEMPLATES: Omit<ExportTemplate, 'onExport'>[] = [
  {
    id: 'full-report',
    label: 'Full Report',
    description: 'Complete listing details with all fields',
    icon: FileSpreadsheet,
    format: 'xlsx',
  },
  {
    id: 'performance-summary',
    label: 'Performance Summary',
    description: 'Views, enquiries, bookings, and revenue',
    icon: FileBarChart,
    format: 'csv',
  },
  {
    id: 'active-listings',
    label: 'Active Listings Only',
    description: 'Currently active properties',
    icon: FileText,
    format: 'csv',
  },
  {
    id: 'contact-info',
    label: 'Contact Information',
    description: 'Owner details and contact data',
    icon: FileText,
    format: 'csv',
  },
  {
    id: 'financial-data',
    label: 'Financial Data',
    description: 'Pricing, revenue, and occupancy rates',
    icon: FileBarChart,
    format: 'xlsx',
  },
  {
    id: 'analytics-chart',
    label: 'Analytics Chart',
    description: 'Visual performance chart as image',
    icon: Image,
    format: 'png',
  },
];

/**
 * Example usage:
 *
 * const exportTemplates: ExportTemplate[] = DEFAULT_EXPORT_TEMPLATES.map((template) => ({
 *   ...template,
 *   onExport: async () => {
 *     const filteredListings = getFilteredListings();
 *     switch (template.id) {
 *       case 'full-report':
 *         await exportToXLSX(filteredListings, 'all-fields');
 *         toast.success(`Exported ${filteredListings.length} listings to Excel`);
 *         break;
 *       case 'performance-summary':
 *         await exportToCSV(filteredListings, ['views', 'enquiries', 'bookings']);
 *         toast.success(`Exported performance data for ${filteredListings.length} listings`);
 *         break;
 *       // ... handle other templates
 *     }
 *   },
 * }));
 *
 * <ExportTemplates
 *   templates={exportTemplates}
 *   currentFilterCount={filteredListings.length}
 *   disabled={filteredListings.length === 0}
 * />
 */
