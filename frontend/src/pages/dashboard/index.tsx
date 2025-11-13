import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { getDomainConfig } from '../../features/seller-dashboard/domainRegistry';

/**
 * Dashboard Index Page
 * Redirects to user's primary domain home or real estate as default
 */
const DashboardIndexPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated || user?.user_type !== 'business') {
    return <Navigate to="/" replace />;
  }

  // TODO: Get user's primary domain from backend
  // For now, default to real estate
  const primaryDomain = 'real_estate';
  const domainConfig = getDomainConfig(primaryDomain);

  return <Navigate to={domainConfig.homePath} replace />;
};

export default DashboardIndexPage;
