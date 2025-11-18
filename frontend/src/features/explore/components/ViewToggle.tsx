/**
 * ViewToggle - Switch between Grid, List, and Map views
 */

import React from 'react';
import { LayoutGrid, List, Map } from 'lucide-react';

export type ViewMode = 'grid' | 'list' | 'map';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  mode,
  onChange,
  className = '',
}) => {
  const views: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'grid', icon: <LayoutGrid className="w-5 h-5" />, label: 'Grid' },
    { mode: 'list', icon: <List className="w-5 h-5" />, label: 'List' },
    { mode: 'map', icon: <Map className="w-5 h-5" />, label: 'Map' },
  ];

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm ${className}`}
    >
      {views.map((view) => (
        <button
          key={view.mode}
          onClick={() => onChange(view.mode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm ${
            mode === view.mode
              ? 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-brand-50/80 hover:text-brand-600'
          }`}
          title={`${view.label} view`}
        >
          {view.icon}
          <span className="hidden md:inline">{view.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;
