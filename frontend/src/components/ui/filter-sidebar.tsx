/**
 * FilterSidebar - Collapsible filter sidebar with glass morphism
 * Sticky positioning with category-specific filters
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import PillButton from './pill-button';

export interface FilterSection {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultExpanded?: boolean;
}

export interface FilterSidebarProps {
  filters: FilterSection[];
  onReset?: () => void;
  className?: string;
}

const FilterSidebar = React.forwardRef<HTMLDivElement, FilterSidebarProps>(
  ({ filters, onReset, className }, ref) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
      new Set(filters.filter((f) => f.defaultExpanded).map((f) => f.id))
    );

    const toggleSection = (id: string) => {
      setExpandedSections((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    };

    return (
      <div
        ref={ref}
        className={cn(
          'glass-card',
          'w-full lg:w-80',
          'sticky top-4',
          'max-h-[calc(100vh-2rem)]',
          'overflow-y-auto',
          className
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <h3 className="font-semibold text-foreground font-[family:var(--font-heading)]">
              Filters
            </h3>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter sections */}
        <div className="p-4 space-y-4">
          {filters.map((section) => {
            const isExpanded = expandedSections.has(section.id);

            return (
              <div
                key={section.id}
                className="border-b border-neutral-100 last:border-b-0 pb-4 last:pb-0"
              >
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between py-2 text-left hover:text-primary transition-colors"
                >
                  <span className="font-semibold text-foreground">
                    {section.title}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Section content */}
                {isExpanded && (
                  <div className="mt-3 animate-fade-in">{section.content}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Apply button */}
        <div className="p-4 border-t border-border">
          <PillButton variant="primary" className="w-full">
            Apply Filters
          </PillButton>
        </div>
      </div>
    );
  }
);

FilterSidebar.displayName = 'FilterSidebar';

export { FilterSidebar };
export default FilterSidebar;
