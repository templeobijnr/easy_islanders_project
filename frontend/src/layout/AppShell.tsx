import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import LeftRail from '../features/left-rail/LeftRail';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Only show LeftRail on ChatPage (root path)
  const showLeftRail = location.pathname === '/';

  // Dashboard has its own internal layout
  const isDashboard = location.pathname.startsWith('/dashboard');

  if (isDashboard) {
    // Dashboard gets full width, no container constraints
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 text-slate-900">
        <Header />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 text-slate-900">
      <Header />
      <div className={`mx-auto max-w-7xl px-4 py-4 ${showLeftRail ? 'grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4' : ''}`}>
        {/* Left Rail - only on ChatPage */}
        {showLeftRail && (
          <aside className="hidden lg:block">
            <LeftRail />
          </aside>
        )}

        {/* Main Content Area */}
        <main className={!showLeftRail && !isDashboard ? 'max-w-5xl mx-auto w-full' : ''}>{children}</main>
      </div>
    </div>
  );
}