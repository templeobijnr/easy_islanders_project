import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SellerDashboardLayout from './layout/SellerDashboardLayout';
import MarketplaceOverview from './components/MarketplaceOverview';
import ProductManagement from './components/ProductManagement';
import ProductUploadForm from './components/ProductUploadForm';
import OrderManagement from './components/OrderManagement';
import SalesAnalytics from './components/SalesAnalytics';

const MarketplaceRoutes: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToUpload = () => {
    navigate('/dashboard/marketplace/products/upload');
  };

  const handleNavigateToAnalytics = () => {
    navigate('/dashboard/marketplace/analytics');
  };

  const handleNavigateToProducts = () => {
    navigate('/dashboard/marketplace/products');
  };

  const handleUploadSubmit = async (data: unknown) => {
    // TODO: Integrate with marketplace product creation API
    // For now we just log and rely on local UI state
    // eslint-disable-next-line no-console
    console.log('[MarketplaceRoutes] Product upload submitted', data);
  };

  return (
    <SellerDashboardLayout businessType="marketplace">
      <Routes>
        <Route
          index
          element={
            <MarketplaceOverview
              onNavigateToUpload={handleNavigateToUpload}
              onNavigateToAnalytics={handleNavigateToAnalytics}
              onNavigateToProducts={handleNavigateToProducts}
            />
          }
        />
        <Route path="products" element={<ProductManagement />} />
        <Route
          path="products/upload"
          element={<ProductUploadForm onSubmit={handleUploadSubmit} />}
        />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="analytics" element={<SalesAnalytics />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </SellerDashboardLayout>
  );
};

export default MarketplaceRoutes;
