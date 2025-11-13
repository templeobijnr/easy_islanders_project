import React from 'react';
import { Navbar04 } from '../components/ui/shadcn-io/navbar-04';

type Props = { children: React.ReactNode };

/**
 * Main Application Shell
 * Provides consistent layout with navbar and main content area
 */
export const AppShell: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar04 />

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
};

export default AppShell;