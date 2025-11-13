import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { CalendarPage } from '../../../../features/seller-dashboard/domains/real-estate/calendar/CalendarPage';

/**
 * Real Estate Calendar Page
 * Route: /dashboard/home/real-estate/calendar
 */
const RealEstateCalendarRoute: React.FC = () => (
  <DomainProvider domainId="real_estate">
    <DashboardLayout>
      <CalendarPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateCalendarRoute;
