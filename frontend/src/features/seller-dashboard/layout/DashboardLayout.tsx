import { useState, ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { TopBar } from "./TopBar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-emerald-50/50 to-slate-50">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-24 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
        {/* Dashboard Sidebar - matches LeftRail styling */}
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Dashboard Content */}
        <main className="min-h-[calc(100vh-6rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
