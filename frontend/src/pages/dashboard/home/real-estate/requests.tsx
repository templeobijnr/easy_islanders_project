import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { RequestsPage } from '../../../../features/seller-dashboard/domains/real-estate/requests/RequestsPage';

/**
 * Real Estate Requests Page
 * Route: /dashboard/home/real-estate/requests
 */
const RealEstateRequestsRoute: React.FC = () => (
  <DomainProvider domainId="real_estate">
    <DashboardLayout>
      <RequestsPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateRequestsRoute;
