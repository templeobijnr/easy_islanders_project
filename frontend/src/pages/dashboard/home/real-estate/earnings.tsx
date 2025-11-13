import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { EarningsPage } from '../../../../features/seller-dashboard/domains/real-estate/earnings/EarningsPage';

/**
 * Real Estate Earnings Page
 * Route: /dashboard/home/real-estate/earnings
 */
const RealEstateEarningsRoute: React.FC = () => (
  <DomainProvider domainId="real_estate">
    <DashboardLayout>
      <EarningsPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateEarningsRoute;
