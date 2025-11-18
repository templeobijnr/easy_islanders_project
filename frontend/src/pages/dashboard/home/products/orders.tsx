import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import OrderManagement from '../../../../features/marketplace/components/OrderManagement';

/**
 * Orders Management Page
 * Route: /dashboard/home/products/orders
 */
const ProductsOrdersPage: React.FC = () => (
  <DomainProvider domainId="products" initialSection="bookings">
    <DashboardLayout>
      <OrderManagement />
    </DashboardLayout>
  </DomainProvider>
);

export default ProductsOrdersPage;

