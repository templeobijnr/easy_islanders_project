import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3, FileText, Settings, HelpCircle, LogOut, X,
  LayoutDashboard, MessageSquare, DollarSign, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DashboardSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { handleLogout } = useAuth();
  const [expandedMenu, setExpandedMenu] = React.useState('dashboard');

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      submenu: [
        { label: 'My Listings', path: '/dashboard/my-listings', icon: FileText },
        { label: 'Seller Inbox', path: '/dashboard/seller-inbox', icon: MessageSquare },
        { label: 'Sales', path: '/dashboard/sales', icon: DollarSign },
        { label: 'Messages', path: '/dashboard/messages', icon: MessageSquare },
      ]
    },
    { label: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Business Profile', path: '/dashboard/profile', icon: Settings },
    { label: 'Help & Support', path: '/dashboard/help', icon: HelpCircle },
  ];

  const isActive = (path) => location.pathname === path;
  const isDashboardActive = location.pathname.startsWith('/dashboard/my-listings') || 
                            location.pathname.startsWith('/dashboard/seller-inbox') ||
                            location.pathname.startsWith('/dashboard/sales') ||
                            location.pathname.startsWith('/dashboard/messages');

  const handleLogoutClick = () => {
    handleLogout();
    onClose();
  };

  const toggleMenu = (menuLabel) => {
    setExpandedMenu(expandedMenu === menuLabel ? null : menuLabel);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static top-20 left-0 h-[calc(100vh-80px)] w-64 bg-gray-50 border-r border-gray-200
          transform transition-transform duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:w-60 overflow-y-auto flex flex-col
        `}
      >
        <div className="lg:hidden flex justify-end p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-6 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isExpanded = expandedMenu === item.label;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isItemActive = hasSubmenu ? isDashboardActive : isActive(item.path);

            return (
              <div key={index}>
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium
                      transition-all duration-200 ease-in-out
                      ${isExpanded || isItemActive
                        ? 'bg-opacity-10 bg-brand text-brand border-l-4 border-brand'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg font-medium
                      transition-all duration-200 ease-in-out
                      ${isItemActive
                        ? 'bg-opacity-10 bg-brand text-brand border-l-4 border-brand'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}

                {hasSubmenu && isExpanded && (
                  <div className="mt-2 ml-4 space-y-1 border-l-2 border-gray-300 pl-2">
                    {item.submenu.map((subitem) => {
                      const SubIcon = subitem.icon;
                      const active = isActive(subitem.path);
                      return (
                        <Link
                          key={subitem.path}
                          to={subitem.path}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                            transition-all duration-200 ease-in-out
                            ${active
                              ? 'text-brand bg-opacity-10 bg-brand'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            }
                          `}
                        >
                          <SubIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{subitem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogoutClick}
            className="
              flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium
              text-gray-600 hover:bg-gray-100 hover:text-gray-800
              transition-all duration-200 ease-in-out
            "
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
