import React from 'react';
import { DomainProvider } from '@features/seller-dashboard/context/DomainContext';
import DashboardLayout from '@features/seller-dashboard/layout/DashboardLayout';
import { ListingDetailPage } from '@features/seller-dashboard/domains/real-estate/portfolio/ListingDetailPage';

/**
 * Listing Detail Page Route
 * Route: /dashboard/home/real-estate/portfolio/listing/:id
 *
 * Comprehensive management suite for a single listing showing:
 * - Overview, messages, requests, bookings
 * - Calendar, pricing, analytics, activity
 * - All management tools in one place
 */
const ListingDetailRoute: React.FC = () => (
  <DomainProvider domainId="real_estate">
    <DashboardLayout>
      <ListingDetailPage />
    </DashboardLayout>
  </DomainProvider>
);

export default ListingDetailRoute;
