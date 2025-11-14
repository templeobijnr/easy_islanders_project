import React from 'react';
import { DomainProvider } from '../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../features/seller-dashboard/layout/DashboardLayout';
import { RealEstateOverviewPage } from '@features/seller-dashboard/domains/real-estate/overview/RealEstateOverviewPage';

/**
 * Real Estate Domain Home Page
 * Route: /dashboard/home/real-estate
 */
const RealEstateHomePage: React.FC = () => (
  <DomainProvider domainId="real_estate" initialSection="home">
    <DashboardLayout>
      <RealEstateOverviewPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateHomePage;
