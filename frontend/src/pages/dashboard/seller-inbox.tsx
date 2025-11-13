import React from 'react';
import { DomainProvider } from '../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../features/seller-dashboard/layout/DashboardLayout';
import SellerInbox from './SellerInbox';

/**
 * Seller Inbox Page
 * Route wrapper for /dashboard/seller-inbox
 */
const SellerInboxPage: React.FC = () => (
  <DomainProvider initialSection="seller_inbox">
    <DashboardLayout>
      <SellerInbox />
    </DashboardLayout>
  </DomainProvider>
);

export default SellerInboxPage;
