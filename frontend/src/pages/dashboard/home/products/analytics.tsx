import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import SalesAnalytics from '../../../../features/marketplace/components/SalesAnalytics';

/**
 * Products Analytics Page
 * Route: /dashboard/home/products/analytics
 */
const ProductsAnalyticsPage: React.FC = () => (
  <DomainProvider domainId="products" initialSection="analytics">
    <DashboardLayout>
      <SalesAnalytics />
    </DashboardLayout>
  </DomainProvider>
);

export default ProductsAnalyticsPage;

