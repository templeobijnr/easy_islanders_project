import React from 'react';
import { DomainProvider } from '../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../features/seller-dashboard/layout/DashboardLayout';
import Sales from './Sales';

const SalesPage: React.FC = () => (
  <DomainProvider initialSection="sales">
    <DashboardLayout>
      <Sales />
    </DashboardLayout>
  </DomainProvider>
);

export default SalesPage;
