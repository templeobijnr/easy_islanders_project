import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Core pages
import FeaturedPanel from '../features/featured/FeaturedPanel';
import ChatPage from '../features/chat/ChatPage';

// Dashboard pages
import DashboardIndexPage from '../pages/dashboard/DashboardIndexPage';
import DashboardMyListingsPage from '../pages/dashboard/MyListingsPage';
import DashboardBookingsPage from '../pages/dashboard/BookingsPage';
import DashboardSellerInboxPage from '../pages/dashboard/SellerInboxPage';
import DashboardBroadcastsPage from '../pages/dashboard/BroadcastsPage';
import DashboardSalesPage from '../pages/dashboard/SalesPage';
import DashboardMessagesPage from '../pages/dashboard/MessagesPage';
import DashboardAnalyticsPage from '../pages/dashboard/AnalyticsPage';
import DashboardProfilePage from '../pages/dashboard/ProfilePage';
import DashboardHelpPage from '../pages/dashboard/HelpPage';

// Domain-specific home pages
import RealEstateHomePage from '../pages/dashboard/home/real-estate';
import CarsHomePage from '../pages/dashboard/home/cars';
import EventsHomePage from '../pages/dashboard/home/events';
import ServicesHomePage from '../pages/dashboard/home/services';
import RestaurantsHomePage from '../pages/dashboard/home/restaurants';
import P2PHomePage from '../pages/dashboard/home/p2p';

// Legacy pages (to be migrated)
import CreateListing from '../pages/CreateListing';
import Bookings from '../pages/Bookings';
import Messages from '../pages/Messages';
import Requests from '../pages/Requests';

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Core routes */}
    <Route path="/" element={<FeaturedPanel />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/chat/:conversationId" element={<ChatPage />} />

    {/* Legacy routes (to be migrated to features) */}
    <Route path="/listings/create" element={<CreateListing />} />
    <Route path="/create-listing" element={<Navigate to="/listings/create" replace />} />
    <Route path="/bookings" element={<Bookings />} />
    <Route path="/messages" element={<Messages />} />
    <Route path="/requests" element={<Requests />} />

    {/* Dashboard routes */}
    <Route path="/dashboard" element={<DashboardIndexPage />} />
    <Route path="/dashboard/my-listings" element={<DashboardMyListingsPage />} />
    <Route path="/dashboard/bookings" element={<DashboardBookingsPage />} />
    <Route path="/dashboard/seller-inbox" element={<DashboardSellerInboxPage />} />
    <Route path="/dashboard/broadcasts" element={<DashboardBroadcastsPage />} />
    <Route path="/dashboard/sales" element={<DashboardSalesPage />} />
    <Route path="/dashboard/messages" element={<DashboardMessagesPage />} />
    <Route path="/dashboard/analytics" element={<DashboardAnalyticsPage />} />
    <Route path="/dashboard/profile" element={<DashboardProfilePage />} />
    <Route path="/dashboard/help" element={<DashboardHelpPage />} />

    {/* Domain-specific home pages */}
    <Route path="/dashboard/home/real-estate" element={<RealEstateHomePage />} />
    <Route path="/dashboard/home/cars" element={<CarsHomePage />} />
    <Route path="/dashboard/home/events" element={<EventsHomePage />} />
    <Route path="/dashboard/home/services" element={<ServicesHomePage />} />
    <Route path="/dashboard/home/restaurants" element={<RestaurantsHomePage />} />
    <Route path="/dashboard/home/p2p" element={<P2PHomePage />} />

    {/* Catch-all redirect */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
