/**
 * HelpTooltip Component
 *
 * Provides inline help for metrics and features
 */

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  title: string;
  description: string;
  benchmark?: string;
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  description,
  benchmark,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        className="inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-slate-100 transition-colors"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-label={`Help: ${title}`}
      >
        <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-64 p-3 bg-slate-900 text-white text-sm rounded-lg shadow-lg left-1/2 -translate-x-1/2 bottom-full mb-2"
          role="tooltip"
        >
          <div className="font-semibold mb-1">{title}</div>
          <div className="text-slate-300 text-xs leading-relaxed">{description}</div>
          {benchmark && (
            <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
              {benchmark}
            </div>
          )}
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};
