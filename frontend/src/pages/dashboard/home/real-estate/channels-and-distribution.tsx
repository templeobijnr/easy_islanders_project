import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { ChannelsAndDistributionPage } from '../../../../features/seller-dashboard/domains/real-estate/channels-and-distribution/ChannelsAndDistributionPage';

/**
 * Real Estate Channels and Distribution Page
 * Route: /dashboard/home/real-estate/channels-and-distribution
 */
const RealEstateChannelsAndDistributionRoute: React.FC = () => (
  <DomainProvider domainId="real_estate" initialSection="channels-and-distribution">
    <DashboardLayout>
      <ChannelsAndDistributionPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateChannelsAndDistributionRoute;
