import React from 'react';
import { DomainProvider } from '../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../features/seller-dashboard/layout/DashboardLayout';
import { DomainHomeProducts } from '../../../features/seller-dashboard/domains/products/DomainHomeProducts';

/**
 * Products / Marketplace Domain Home Page
 * Route: /dashboard/home/products
 */
const ProductsHomePage: React.FC = () => (
  <DomainProvider domainId="products" initialSection="home">
    <DashboardLayout>
      <DomainHomeProducts />
    </DashboardLayout>
  </DomainProvider>
);

export default ProductsHomePage;

