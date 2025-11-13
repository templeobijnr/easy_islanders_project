import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { SalesPipelinePage } from '../../../../features/seller-dashboard/domains/real-estate/sales-pipeline/SalesPipelinePage';

/**
 * Real Estate Sales Pipeline Page
 * Route: /dashboard/home/real-estate/sales-pipeline
 */
const RealEstateSalesPipelineRoute: React.FC = () => (
  <DomainProvider domainId="real_estate" initialSection="sales-pipeline">
    <DashboardLayout>
      <SalesPipelinePage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateSalesPipelineRoute;
