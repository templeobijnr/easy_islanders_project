import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';

/**
 * Dashboard Index Page
 * Redirects to the main dashboard home page that shows all business domains
 */
const DashboardIndexPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated || user?.user_type !== 'business') {
    return <Navigate to="/" replace />;
  }

  // Redirect to the main dashboard home page that shows all business domains
  return <Navigate to="/dashboard/home" replace />;
};

export default DashboardIndexPage;
