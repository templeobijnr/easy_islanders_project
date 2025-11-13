import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { MaintenancePage } from '../../../../features/seller-dashboard/domains/real-estate/maintenance/MaintenancePage';

/**
 * Real Estate Maintenance Page
 * Route: /dashboard/home/real-estate/maintenance
 */
const RealEstateMaintenanceRoute: React.FC = () => (
  <DomainProvider domainId="real_estate" initialSection="maintenance">
    <DashboardLayout>
      <MaintenancePage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateMaintenanceRoute;
