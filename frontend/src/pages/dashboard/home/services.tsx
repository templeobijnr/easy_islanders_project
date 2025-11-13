import React from 'react';
import { DomainProvider } from '../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../features/seller-dashboard/layout/DashboardLayout';
import { DomainHomeServices } from '../../../features/seller-dashboard/domains/services/DomainHomeServices';

const ServicesHomePage: React.FC = () => (
  <DomainProvider domainId="services" initialSection="home">
    <DashboardLayout>
      <DomainHomeServices />
    </DashboardLayout>
  </DomainProvider>
);

export default ServicesHomePage;
