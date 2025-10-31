import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const DashboardHeader = ({ title, subtitle, action }) => {
  const location = useLocation();

  // Generate breadcrumb
  const getBreadcrumbs = () => {
    const pathArray = location.pathname.split('/').filter((x) => x);
    return pathArray.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' '),
      path: '/' + pathArray.slice(0, index + 1).join('/'),
    }));
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link to="/dashboard" className="hover:text-brand transition-colors">
            Dashboard
          </Link>
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.path}>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-800 font-medium">
                {breadcrumb.label}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Title and Subtitle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Action Button (optional) */}
          {action && <div>{action}</div>}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
