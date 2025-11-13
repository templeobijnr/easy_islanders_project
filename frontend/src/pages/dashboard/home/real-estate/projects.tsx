import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import DashboardLayout from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { ProjectsPage } from '../../../../features/seller-dashboard/domains/real-estate/projects/ProjectsPage';

/**
 * Real Estate Projects Page
 * Route: /dashboard/home/real-estate/projects
 */
const RealEstateProjectsRoute: React.FC = () => (
  <DomainProvider domainId="real_estate" initialSection="projects">
    <DashboardLayout>
      <ProjectsPage />
    </DashboardLayout>
  </DomainProvider>
);

export default RealEstateProjectsRoute;
