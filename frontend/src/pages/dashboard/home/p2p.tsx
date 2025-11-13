import React from 'react';
import { DomainProvider } from '../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../features/seller-dashboard/layout/DashboardLayout';
import { DomainHomeP2P } from '../../../features/seller-dashboard/domains/p2p/DomainHomeP2P';

const P2PHomePage: React.FC = () => (
  <DomainProvider domainId="p2p" initialSection="home">
    <DashboardLayout>
      <DomainHomeP2P />
    </DashboardLayout>
  </DomainProvider>
);

export default P2PHomePage;
