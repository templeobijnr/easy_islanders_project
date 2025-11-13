import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { PortfolioPage } from '../../../../features/seller-dashboard/domains/real-estate/portfolio/PortfolioPage';

/**
 * Real Estate Portfolio Page
 * Route: /dashboard/home/real-estate/portfolio
 */
const RealEstatePortfolioRoute: React.FC = () => (
  <DomainProvider domainId="real_estate">
    <DashboardLayout>
      <PortfolioPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstatePortfolioRoute;
