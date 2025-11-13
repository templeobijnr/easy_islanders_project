import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { LocationPage } from '../../../../features/seller-dashboard/domains/real-estate/location/LocationPage';

/**
 * Real Estate Location Page
 * Route: /dashboard/home/real-estate/location
 */
const RealEstateLocationRoute: React.FC = () => (
  <DomainProvider domainId="real_estate">
    <DashboardLayout>
      <LocationPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateLocationRoute;
