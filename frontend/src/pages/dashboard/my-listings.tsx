import React from 'react';
import { DomainProvider } from '../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../features/seller-dashboard/layout/DashboardLayout';
import MyListings from './MyListings';

/**
 * My Listings Page
 * Route wrapper for /dashboard/my-listings
 */
const MyListingsPage: React.FC = () => (
  <DomainProvider initialSection="my_listings">
    <DashboardLayout>
      <MyListings />
    </DashboardLayout>
  </DomainProvider>
);

export default MyListingsPage;
