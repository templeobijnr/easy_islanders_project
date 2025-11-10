import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarNav />

      {/* Main content area */}
      <div className="flex-1 ml-60">
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="pt-20 px-6 pb-6 overflow-y-auto h-[calc(100vh-64px)] bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
