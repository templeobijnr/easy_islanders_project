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
import SellerInbox from './SellerInbox';
import { useAuth } from '../../contexts/AuthContext';

// Real Estate Domain Pages
import RealEstate from './home/real-estate/index';
import Portfolio from './home/real-estate/portfolio';
import Location from './home/real-estate/location';
import Occupancy from './home/real-estate/occupancy';
import Earnings from './home/real-estate/earnings';
import SalesPipeline from './home/real-estate/sales-pipeline';
import Requests from './home/real-estate/requests';
import Calendar from './home/real-estate/calendar';
import Maintenance from './home/real-estate/maintenance';
import OwnersAndTenants from './home/real-estate/owners-and-tenants';
import PricingAndPromotions from './home/real-estate/pricing-and-promotions';
import ChannelsAndDistribution from './home/real-estate/channels-and-distribution';
import Projects from './home/real-estate/projects';

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
            <Route path="/seller-inbox" element={<SellerInbox />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<BusinessProfile />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/help" element={<Help />} />

            {/* Real Estate Domain Routes */}
            <Route path="/home/real-estate" element={<RealEstate />} />
            <Route path="/home/real-estate/portfolio" element={<Portfolio />} />
            <Route path="/home/real-estate/location" element={<Location />} />
            <Route path="/home/real-estate/occupancy" element={<Occupancy />} />
            <Route path="/home/real-estate/earnings" element={<Earnings />} />
            <Route path="/home/real-estate/sales-pipeline" element={<SalesPipeline />} />
            <Route path="/home/real-estate/requests" element={<Requests />} />
            <Route path="/home/real-estate/calendar" element={<Calendar />} />
            <Route path="/home/real-estate/maintenance" element={<Maintenance />} />
            <Route path="/home/real-estate/owners-and-tenants" element={<OwnersAndTenants />} />
            <Route path="/home/real-estate/pricing-and-promotions" element={<PricingAndPromotions />} />
            <Route path="/home/real-estate/channels-and-distribution" element={<ChannelsAndDistribution />} />
            <Route path="/home/real-estate/projects" element={<Projects />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
