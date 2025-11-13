import React from 'react';
import { DomainProvider } from '../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../features/seller-dashboard/layout/DashboardLayout';
import { DomainHomeRestaurants } from '../../../features/seller-dashboard/domains/restaurants/DomainHomeRestaurants';

const RestaurantsHomePage: React.FC = () => (
  <DomainProvider domainId="restaurants" initialSection="home">
    <DashboardLayout>
      <DomainHomeRestaurants />
    </DashboardLayout>
  </DomainProvider>
);

export default RestaurantsHomePage;
