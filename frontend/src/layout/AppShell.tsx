import React from 'react';
import Header from './Header';
import LeftRail from '../features/left-rail/LeftRail';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 text-slate-900">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
        {/* Left Rail - hidden on mobile, sticky on desktop */}
        <aside className="hidden lg:block">
          <LeftRail />
        </aside>

        {/* Main Content Area */}
        <main>{children}</main>
      </div>
    </div>
  );
}