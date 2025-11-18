import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence as FMAnimatePresence } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  Plus,
  Store,
  TrendingUp,
  DollarSign,
  Box,
  Tag,
  Truck,
  MessageSquare,
  Bell,
  Menu,
  X,
  ChevronDown,
  LayoutGrid,
  User,
  LogOut,
  CreditCard
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { useAuth } from '../../../shared/context/AuthContext';
import { MARKETPLACE_CATEGORIES } from '../constants/categories';

interface DashboardLayoutProps {
  children: React.ReactNode;
  businessType?: 'marketplace' | 'real_estate' | 'events' | 'services';
}

interface QuickStats {
  totalProducts: number;
  activeOrders: number;
  totalRevenue: number;
  pendingReviews: number;
}

// Type-safe wrapper for AnimatePresence to fix TypeScript issues with framer-motion v11
const AnimatePresence = FMAnimatePresence as React.ComponentType<
  React.PropsWithChildren<{ mode?: 'wait' | 'sync' }>
>;

const SellerDashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  businessType = 'marketplace' 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingReviews: 0
  });
  const [notifications, setNotifications] = useState(3);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Mock stats - replace with actual API calls
  useEffect(() => {
    setQuickStats({
      totalProducts: 156,
      activeOrders: 23,
      totalRevenue: 12580,
      pendingReviews: 8
    });
  }, []);

  const navigationItems = [
    {
      name: 'Overview',
      href: '/dashboard/marketplace',
      icon: BarChart3,
      badge: null
    },
    {
      name: 'Products',
      href: '/dashboard/marketplace/products',
      icon: Package,
      badge: quickStats.totalProducts
    },
    {
      name: 'Orders',
      href: '/dashboard/marketplace/orders',
      icon: ShoppingCart,
      badge: quickStats.activeOrders
    },
    {
      name: 'Customers',
      href: '/dashboard/marketplace/customers',
      icon: Users,
      badge: null
    },
    {
      name: 'Analytics',
      href: '/dashboard/marketplace/analytics',
      icon: TrendingUp,
      badge: null
    },
    {
      name: 'Marketing',
      href: '/dashboard/marketplace/marketing',
      icon: Tag,
      badge: null
    },
    {
      name: 'Shipping',
      href: '/dashboard/marketplace/shipping',
      icon: Truck,
      badge: null
    },
    {
      name: 'Messages',
      href: '/dashboard/marketplace/messages',
      icon: MessageSquare,
      badge: 5
    },
    {
      name: 'Settings',
      href: '/dashboard/marketplace/settings',
      icon: Settings,
      badge: null
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo and Business Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-lime-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {user?.business_name || 'My Store'}
            </h2>
            <p className="text-sm text-gray-500 capitalize">{businessType.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Products</span>
            </div>
            <p className="text-lg font-bold text-blue-900 mt-1">{quickStats.totalProducts}</p>
          </Card>
          <Card className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-600 font-medium">Revenue</span>
            </div>
            <p className="text-lg font-bold text-emerald-900 mt-1">€{quickStats.totalRevenue.toLocaleString()}</p>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-lime-100 text-lime-900 border border-lime-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-lime-600' : ''}`} />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge 
                  variant={active ? 'default' : 'secondary'}
                  className={`text-xs ${active ? 'bg-lime-600' : ''}`}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Add Product Button */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          className="w-full bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-700 hover:to-emerald-700 text-white"
          onClick={() => navigate('/seller/products/add')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 relative z-10">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <h1 className="text-xl font-semibold text-gray-900">
                {navigationItems.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs bg-red-500">
                    {notifications}
                  </Badge>
                )}
              </Button>

              {/* Profile dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        to="/seller/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboardLayout;
