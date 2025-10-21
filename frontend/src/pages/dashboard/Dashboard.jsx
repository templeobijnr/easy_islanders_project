import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import MyListings from './MyListings';
import BusinessProfile from './BusinessProfile';
import Analytics from './Analytics';
import Help from './Help';
import Sales from './Sales';
import Messages from './Messages';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated || user?.user_type !== 'business') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center gap-4 px-6 py-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Dashboard</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard/my-listings" replace />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<BusinessProfile />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
