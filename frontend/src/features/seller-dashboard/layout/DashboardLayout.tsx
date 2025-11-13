import { useState, ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-emerald-50/50 to-slate-50">
      {/* Mobile menu button - only shown on mobile, desktop has main navbar */}
      <div className="lg:hidden fixed top-24 left-4 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-slate-200"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
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
