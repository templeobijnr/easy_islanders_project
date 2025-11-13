import React from 'react';
import { DomainProvider } from '../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../features/seller-dashboard/layout/DashboardLayout';
import { DomainHomeCars } from '../../../features/seller-dashboard/domains/cars/DomainHomeCars';

const CarsHomePage: React.FC = () => (
  <DomainProvider domainId="cars" initialSection="home">
    <DashboardLayout>
      <DomainHomeCars />
    </DashboardLayout>
  </DomainProvider>
);

export default CarsHomePage;
