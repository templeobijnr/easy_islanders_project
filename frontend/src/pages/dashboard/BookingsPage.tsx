import React from 'react';
import { DomainProvider } from '../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../features/seller-dashboard/layout/DashboardLayout';
import Bookings from './Bookings.jsx';

/**
 * Bookings Page
 * Route wrapper for /dashboard/bookings
 */
const BookingsPage: React.FC = () => (
  <DomainProvider initialSection="bookings">
    <DashboardLayout>
      <Bookings />
    </DashboardLayout>
  </DomainProvider>
);

export default BookingsPage;
