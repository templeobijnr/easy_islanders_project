import React from 'react';
import { DomainProvider } from '@features/seller-dashboard/context/DomainContext';
import DashboardLayout from '@features/seller-dashboard/layout/DashboardLayout';
import { PortfolioManagementPage } from '@features/seller-dashboard/domains/real-estate/portfolio/PortfolioManagementPage';

/**
 * Real Estate Portfolio Page - Simplified Management Version
 * Route: /dashboard/home/real-estate/portfolio
 *
 * Features:
 * - Tab-based organization by listing type (Daily Rental, Long-term, Sale, Projects)
 * - At-a-glance metrics on each card
 * - Quick communication via slide-over panels (Messages, Requests, Bookings)
 * - Calendar management (block dates, custom pricing)
 * - Search & filter functionality
 * - Activity tracking
 * - Practical action-focused interface
 */
const RealEstatePortfolioRoute: React.FC = () => (
  <DomainProvider domainId="real_estate">
    <DashboardLayout>
      <PortfolioManagementPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstatePortfolioRoute;
