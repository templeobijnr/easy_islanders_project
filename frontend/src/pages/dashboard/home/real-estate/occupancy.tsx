import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { OccupancyPage } from '../../../../features/seller-dashboard/domains/real-estate/occupancy/OccupancyPage';

/**
 * Real Estate Occupancy Page
 * Route: /dashboard/home/real-estate/occupancy
 */
const RealEstateOccupancyRoute: React.FC = () => (
  <DomainProvider domainId="real_estate" initialSection="occupancy">
    <DashboardLayout>
      <OccupancyPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateOccupancyRoute;
