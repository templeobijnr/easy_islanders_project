import React from 'react';
import { DomainProvider } from '../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../features/seller-dashboard/layout/DashboardLayout';
import BusinessProfile from './BusinessProfile';

const ProfilePage: React.FC = () => (
  <DomainProvider initialSection="profile">
    <DashboardLayout>
      <BusinessProfile />
    </DashboardLayout>
  </DomainProvider>
);

export default ProfilePage;
