import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { PricingAndPromotionsPage } from '../../../../features/seller-dashboard/domains/real-estate/pricing-and-promotions/PricingAndPromotionsPage';

/**
 * Real Estate Pricing and Promotions Page
 * Route: /dashboard/home/real-estate/pricing-and-promotions
 */
const RealEstatePricingAndPromotionsRoute: React.FC = () => (
  <DomainProvider domainId="real_estate">
    <DashboardLayout>
      <PricingAndPromotionsPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstatePricingAndPromotionsRoute;
