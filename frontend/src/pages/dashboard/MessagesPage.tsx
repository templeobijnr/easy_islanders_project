import React from 'react';
import { DomainProvider } from '../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../features/seller-dashboard/layout/DashboardLayout';
import Messages from './Messages.jsx';

const MessagesPage: React.FC = () => (
  <DomainProvider initialSection="messages">
    <DashboardLayout>
      <Messages />
    </DashboardLayout>
  </DomainProvider>
);

export default MessagesPage;
