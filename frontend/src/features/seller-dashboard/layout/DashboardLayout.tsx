import { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
      {/* Dashboard Sidebar - matches LeftRail styling */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Dashboard Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
