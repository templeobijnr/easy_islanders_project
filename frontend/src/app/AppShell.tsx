import React from 'react';
import LeftRail from '../features/left-rail/LeftRail';

type Props = { children: React.ReactNode };

export const AppShell: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 text-slate-900 flex">
      {/* LEFT RAIL */}
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white/90 backdrop-blur">
        <LeftRail />
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4 md:p-6">
        <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 overflow-hidden">
          {children}
        </section>
      </main>
    </div>
  );
};

export default AppShell;