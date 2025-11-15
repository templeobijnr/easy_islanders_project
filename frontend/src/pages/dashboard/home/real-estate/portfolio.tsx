import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { PortfolioPageEnhanced } from '../../../../features/seller-dashboard/domains/real-estate/portfolio/PortfolioPageEnhanced';

/**
 * Real Estate Portfolio Page - Enhanced Version
 * Route: /dashboard/home/real-estate/portfolio
 *
 * Features:
 * - Premium KPI cards with trend indicators
 * - Navigation tabs (Overview, Listings, Analytics, Activity)
 * - Advanced filters and search
 * - Data visualizations and charts
 * - Real backend integration
 */
const RealEstatePortfolioRoute: React.FC = () => (
  <DomainProvider domainId="real_estate">
    <DashboardLayout>
      <PortfolioPageEnhanced />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstatePortfolioRoute;
