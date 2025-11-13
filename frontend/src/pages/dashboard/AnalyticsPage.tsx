import React from 'react';
import { DomainProvider } from '../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../features/seller-dashboard/layout/DashboardLayout';
import Analytics from './Analytics.jsx';

const AnalyticsPage: React.FC = () => (
  <DomainProvider initialSection="analytics">
    <DashboardLayout>
      <Analytics />
    </DashboardLayout>
  </DomainProvider>
);

export default AnalyticsPage;
