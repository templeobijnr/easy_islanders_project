import React from 'react';
import { User, Settings, Search } from '../../../shared/icons';

export const ChatHeader: React.FC = () => {
  return (
    <div className="px-4 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur rounded-t-2xl border-b border-slate-100 z-10">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-lime-500/90" />
        <div className="font-medium text-slate-800">Chat</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
          Press <kbd className="px-1 py-0.5 border rounded bg-white/60">/</kbd> for commands • <kbd className="px-1 py-0.5 border rounded bg-white/60">⌘K</kbd> to search
        </div>
        <button className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition" aria-label="Search">
          <Search size={18} />
        </button>
        <button className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition" aria-label="Profile">
          <User size={18} />
        </button>
        <button className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition" aria-label="Settings">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};