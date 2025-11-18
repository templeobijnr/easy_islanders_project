import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import ProductUploadForm from '../../../../features/marketplace/components/ProductUploadForm';

/**
 * Product Upload Page
 * Route: /dashboard/home/products/upload
 */
const ProductsUploadPage: React.FC = () => {
  const handleUploadSubmit = async (data: unknown) => {
    // TODO: Wire this into a real API endpoint
    // eslint-disable-next-line no-console
    console.log('[ProductsUploadPage] Product upload submitted', data);
  };

  return (
    <DomainProvider domainId="products" initialSection="my_listings">
      <DashboardLayout>
        <ProductUploadForm onSubmit={handleUploadSubmit} />
      </DashboardLayout>
    </DomainProvider>
  );
};

export default ProductsUploadPage;

