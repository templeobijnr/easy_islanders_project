import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { OwnersAndTenantsPage } from '../../../../features/seller-dashboard/domains/real-estate/owners-and-tenants/OwnersAndTenantsPage';

/**
 * Real Estate Owners and Tenants Page
 * Route: /dashboard/home/real-estate/owners-and-tenants
 */
const RealEstateOwnersAndTenantsRoute: React.FC = () => (
  <DomainProvider domainId="real_estate" initialSection="owners-and-tenants">
    <DashboardLayout>
      <OwnersAndTenantsPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateOwnersAndTenantsRoute;
