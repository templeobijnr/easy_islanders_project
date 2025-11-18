import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import ProductManagement from '../../../../features/marketplace/components/ProductManagement';

/**
 * Products Management Page
 * Route: /dashboard/home/products/products
 */
const ProductsManagementPage: React.FC = () => (
  <DomainProvider domainId="products" initialSection="my_listings">
    <DashboardLayout>
      <ProductManagement />
    </DashboardLayout>
  </DomainProvider>
);

export default ProductsManagementPage;

