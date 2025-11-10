import { useState, ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
      {/* Dashboard Sidebar - matches LeftRail styling */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Dashboard Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
