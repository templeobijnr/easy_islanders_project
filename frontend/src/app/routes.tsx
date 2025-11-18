import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Core pages
import ChatPage from '../features/chat/ChatPage';
import ExplorePage from '../features/explore/ExplorePage';

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

// Dashboard home page
import DashboardHomePage from '../pages/dashboard/home';

// Domain-specific home pages
import ProductsHomePage from '../pages/dashboard/home/products';
import ProductsOrdersPage from '../pages/dashboard/home/products/orders';
import ProductsAnalyticsPage from '../pages/dashboard/home/products/analytics';
import ProductsUploadPage from '../pages/dashboard/home/products/upload';
import ProductsManagementPage from '../pages/dashboard/home/products/products';
import RealEstatePortfolioPage from '../pages/dashboard/home/real-estate/portfolio';
import ListingDetailPage from '../pages/dashboard/home/real-estate/listing-detail';
import EditListingPage from '../features/seller-dashboard/domains/real-estate/portfolio/EditListingPage';
import RealEstateLocationPage from '../pages/dashboard/home/real-estate/location';
import RealEstateOccupancyPage from '../pages/dashboard/home/real-estate/occupancy';
import RealEstateEarningsPage from '../pages/dashboard/home/real-estate/earnings';
import RealEstateSalesPipelinePage from '../pages/dashboard/home/real-estate/sales-pipeline';
import RealEstateRequestsPage from '../pages/dashboard/home/real-estate/requests';
import RealEstateCalendarPage from '../pages/dashboard/home/real-estate/calendar';
import RealEstateMaintenancePage from '../pages/dashboard/home/real-estate/maintenance';
import RealEstateOwnersAndTenantsPage from '../pages/dashboard/home/real-estate/owners-and-tenants';
import RealEstatePricingAndPromotionsPage from '../pages/dashboard/home/real-estate/pricing-and-promotions';
import RealEstateChannelsAndDistributionPage from '../pages/dashboard/home/real-estate/channels-and-distribution';
import RealEstateProjectsPage from '../pages/dashboard/home/real-estate/projects';
import StorefrontBuilderPage from '../features/seller-dashboard/domains/products/storefront/StorefrontBuilderPage';
import StorefrontPreviewPage from '../features/seller-dashboard/domains/products/storefront/StorefrontPreviewPage';

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

// Test pages
import TestLocationPage from '../pages/test-location';

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Core routes */}
    <Route path="/" element={<ChatPage />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/chat/:conversationId" element={<ChatPage />} />
    <Route path="/explore" element={<ExplorePage />} />

    {/* Legacy routes (to be migrated) */}
    <Route path="/listings/create" element={<CreateListing />} />
    <Route path="/create-listing" element={<Navigate to="/listings/create" replace />} />
    <Route path="/bookings" element={<Bookings />} />
    <Route path="/messages" element={<Messages />} />
    <Route path="/requests" element={<Requests />} />

    {/* Test routes */}
    <Route path="/test-location" element={<TestLocationPage />} />

    {/* Dashboard routes */}
    <Route path="/dashboard" element={<DashboardIndexPage />} />
    <Route path="/dashboard/home" element={<DashboardHomePage />} />
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
    <Route path="/dashboard/home/real-estate" element={<Navigate to="/dashboard/home/real-estate/portfolio" replace />} />
    <Route path="/dashboard/home/products" element={<ProductsHomePage />} />
    <Route path="/dashboard/home/products/orders" element={<ProductsOrdersPage />} />
    <Route path="/dashboard/home/products/analytics" element={<ProductsAnalyticsPage />} />
    <Route path="/dashboard/home/products/upload" element={<ProductsUploadPage />} />
    <Route path="/dashboard/home/products/products" element={<ProductsManagementPage />} />
    <Route path="/dashboard/home/products/storefront" element={<StorefrontBuilderPage />} />
    <Route path="/store/:storeName" element={<StorefrontPreviewPage />} />
    <Route path="/dashboard/home/real-estate/portfolio/listing/:id/edit" element={<EditListingPage />} />
    <Route path="/dashboard/home/real-estate/portfolio/listing/:id" element={<ListingDetailPage />} />
    <Route path="/dashboard/home/real-estate/portfolio" element={<RealEstatePortfolioPage />} />
    <Route path="/dashboard/home/real-estate/location" element={<RealEstateLocationPage />} />
    <Route path="/dashboard/home/real-estate/occupancy" element={<RealEstateOccupancyPage />} />
    <Route path="/dashboard/home/real-estate/earnings" element={<RealEstateEarningsPage />} />
    <Route path="/dashboard/home/real-estate/sales-pipeline" element={<RealEstateSalesPipelinePage />} />
    <Route path="/dashboard/home/real-estate/requests" element={<RealEstateRequestsPage />} />
    <Route path="/dashboard/home/real-estate/calendar" element={<RealEstateCalendarPage />} />
    <Route path="/dashboard/home/real-estate/maintenance" element={<RealEstateMaintenancePage />} />
    <Route path="/dashboard/home/real-estate/owners-and-tenants" element={<RealEstateOwnersAndTenantsPage />} />
    <Route path="/dashboard/home/real-estate/pricing-and-promotions" element={<RealEstatePricingAndPromotionsPage />} />
    <Route path="/dashboard/home/real-estate/channels-and-distribution" element={<RealEstateChannelsAndDistributionPage />} />
    <Route path="/dashboard/home/real-estate/projects" element={<RealEstateProjectsPage />} />

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
