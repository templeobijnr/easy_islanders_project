import React from 'react';
import { DomainProvider } from '../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../features/seller-dashboard/layout/DashboardLayout';
import Help from './Help.jsx';

const HelpPage: React.FC = () => (
  <DomainProvider initialSection="help">
    <DashboardLayout>
      <Help />
    </DashboardLayout>
  </DomainProvider>
);

export default HelpPage;
