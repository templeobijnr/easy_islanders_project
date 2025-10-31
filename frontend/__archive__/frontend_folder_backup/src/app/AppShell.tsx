import React from 'react';
import LeftRail from '../features/left-rail/LeftRail';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 text-slate-900 flex">
      <LeftRail />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

// Also export default so files importing default AppShell won't break
export default AppShell;