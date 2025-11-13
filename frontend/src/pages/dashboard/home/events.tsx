import React from 'react';
import { DomainProvider } from '../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../features/seller-dashboard/layout/DashboardLayout';
import { DomainHomeEvents } from '../../../features/seller-dashboard/domains/events/DomainHomeEvents';

const EventsHomePage: React.FC = () => (
  <DomainProvider domainId="events" initialSection="home">
    <DashboardLayout>
      <DomainHomeEvents />
    </DashboardLayout>
  </DomainProvider>
);

export default EventsHomePage;
