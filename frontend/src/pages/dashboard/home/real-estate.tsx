import React from 'react';
import { DomainProvider } from '../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../features/seller-dashboard/layout/DashboardLayout';
import { DomainHomeRealEstate } from '../../../features/seller-dashboard/domains/real-estate/DomainHomeRealEstate';

/**
 * Real Estate Domain Home Page
 * Route: /dashboard/home/real-estate
 */
const RealEstateHomePage: React.FC = () => (
  <DomainProvider domainId="real_estate" initialSection="home">
    <DashboardLayout>
      <DomainHomeRealEstate />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateHomePage;
