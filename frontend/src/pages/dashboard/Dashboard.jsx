import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../features/seller-dashboard/layout/DashboardLayout';
import MyListings from './MyListings';
import BusinessProfile from './BusinessProfile';
import Analytics from './Analytics';
import Broadcasts from './Broadcasts';
import Help from './Help';
import Sales from './Sales';
import Messages from './Messages';
import SellerInbox from './SellerInbox';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || user?.user_type !== 'business') {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/my-listings" replace />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/seller-inbox" element={<SellerInbox />} />
        <Route path="/broadcasts" element={<Broadcasts />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<BusinessProfile />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
