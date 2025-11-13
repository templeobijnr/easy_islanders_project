import React from 'react';
import { DomainProvider } from '../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../features/seller-dashboard/layout/DashboardLayout';
import Broadcasts from './Broadcasts';

/**
 * Broadcasts Page
 * Route wrapper for /dashboard/broadcasts
 */
const BroadcastsPage: React.FC = () => (
  <DomainProvider initialSection="broadcasts">
    <DashboardLayout>
      <Broadcasts />
    </DashboardLayout>
  </DomainProvider>
);

export default BroadcastsPage;
