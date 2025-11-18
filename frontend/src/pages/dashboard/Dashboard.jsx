import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Calendar, 
  MapPin, 
  Car, 
  Package, 
  Wrench, 
  UtensilsCrossed, 
  BarChart3,
  TrendingUp,
  DollarSign,
  Plus,
  Settings,
  Bell,
  RefreshCw,
  ArrowUpRight,
  Eye,
  Edit3,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../shared/context/AuthContext';
import axios from 'axios';
import config from '../../config';
import MyListings from './MyListings';
import Sales from './Sales';
import SellerInbox from './SellerInbox';
import { DashboardLayout } from '../../features/seller-dashboard/layout';
import SellerDashboardLayout from '../../features/marketplace/layout/SellerDashboardLayout';
import ProductUploadForm from '../../features/marketplace/components/ProductUploadForm';
import SalesAnalytics from '../../features/marketplace/components/SalesAnalytics';
import MarketplaceOverview from '../../features/marketplace/components/MarketplaceOverview';
import ProductManagement from '../../features/marketplace/components/ProductManagement';
import OrderManagement from '../../features/marketplace/components/OrderManagement';
import { getDomainConfig } from '../../features/seller-dashboard/domainRegistry';

/**
 * Multi-Domain Dashboard Page
 * Comprehensive dashboard with domain-specific sub-dashboards
 * Matches the lime/emerald color scheme used in other dashboard pages
 */

const DOMAINS = [
  {
    id: 'real_estate',
    name: 'Real Estate',
    icon: Building2,
    color: 'lime',
    description: 'Properties, rentals & sales',
    stats: { listings: 24, bookings: 156, revenue: 12500 }
  },
  {
    id: 'events',
    name: 'Events',
    icon: Calendar,
    color: 'purple',
    description: 'Conferences, parties & gatherings',
    stats: { listings: 8, bookings: 45, revenue: 3200 }
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: MapPin,
    color: 'emerald',
    description: 'Tours, experiences & adventures',
    stats: { listings: 12, bookings: 78, revenue: 5600 }
  },
  {
    id: 'appointments',
    name: 'Appointments',
    icon: Calendar,
    color: 'pink',
    description: 'Services, consultations & bookings',
    stats: { listings: 6, bookings: 89, revenue: 4100 }
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    icon: Car,
    color: 'orange',
    description: 'Car rentals & vehicle services',
    stats: { listings: 15, bookings: 34, revenue: 8900 }
  },
  {
    id: 'products',
    name: 'Products',
    icon: Package,
    color: 'yellow',
    description: 'Physical goods & merchandise',
    stats: { listings: 42, bookings: 123, revenue: 6700 }
  },
  {
    id: 'services',
    name: 'Services',
    icon: Wrench,
    color: 'indigo',
    description: 'Professional & personal services',
    stats: { listings: 18, bookings: 67, revenue: 4500 }
  },
  {
    id: 'restaurants',
    name: 'Restaurants',
    icon: UtensilsCrossed,
    color: 'red',
    description: 'Dining, catering & food services',
    stats: { listings: 9, bookings: 234, revenue: 15600 }
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    icon: Package,
    color: 'emerald',
    description: 'E-commerce marketplace for products',
    stats: { listings: 156, bookings: 892, revenue: 45600 }
  }
];

const DOMAIN_ICONS = {
  real_estate: Building2,
  events: Calendar,
  activities: MapPin,
  appointments: Car,
  retail: Package,
  services: Wrench,
  restaurants: UtensilsCrossed,
  marketplace: Package,
};

const DOMAIN_COLORS = {
  real_estate: 'lime',
  events: 'purple', 
  activities: 'blue',
  appointments: 'orange',
  retail: 'yellow',
  services: 'indigo',
  restaurants: 'red',
  marketplace: 'emerald',
};

const colorClasses = {
  lime: {
    bg: 'bg-gradient-to-br from-lime-50 to-lime-100',
    border: 'border-lime-200',
    text: 'text-lime-600',
    hover: 'hover:bg-lime-100'
  },
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    hover: 'hover:bg-emerald-100'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-600',
    hover: 'hover:bg-purple-100'
  },
  pink: {
    bg: 'bg-gradient-to-br from-pink-50 to-pink-100',
    border: 'border-pink-200',
    text: 'text-pink-600',
    hover: 'hover:bg-pink-100'
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
    border: 'border-orange-200',
    text: 'text-orange-600',
    hover: 'hover:bg-orange-100'
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
    border: 'border-yellow-200',
    text: 'text-yellow-600',
    hover: 'hover:bg-yellow-100'
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
    border: 'border-indigo-200',
    text: 'text-indigo-600',
    hover: 'hover:bg-indigo-100'
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-100',
    border: 'border-red-200',
    text: 'text-red-600',
    hover: 'hover:bg-red-100'
  }
};

const DomainCard = ({ domain, onClick, isSelected }) => {
  const Icon = domain.icon;
  const colors = colorClasses[domain.color];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(domain)}
    >
      <Card className={`cursor-pointer transition-all duration-300 border-2 ${
        isSelected 
          ? `${colors.border} ${colors.bg} shadow-lg` 
          : `border-slate-200 hover:shadow-lg ${colors.hover}`
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${colors.bg}`}>
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
            <Badge variant="secondary" className="text-xs">
              {domain.stats.listings} listings
            </Badge>
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{domain.name}</h3>
          <p className="text-sm text-slate-600 mb-4">{domain.description}</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Bookings:</span>
              <span className="font-medium">{domain.stats.bookings}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Revenue:</span>
              <span className="font-medium text-emerald-600">€{domain.stats.revenue.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DomainSubDashboard = ({ domain }) => {
  const Icon = domain.icon;
  const colors = colorClasses[domain.color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Domain Header */}
      <div className={`p-6 rounded-xl ${colors.bg} ${colors.border} border`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-white shadow-sm`}>
            <Icon className={`w-8 h-8 ${colors.text}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{domain.name} Dashboard</h2>
            <p className="text-slate-600">{domain.description}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Listings</p>
                <p className="text-3xl font-bold text-slate-900">{domain.stats.listings}</p>
                <div className="flex items-center gap-1 text-emerald-600 mt-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-semibold">12%</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <BarChart3 className={`w-6 h-6 ${colors.text}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-slate-900">{domain.stats.bookings}</p>
                <div className="flex items-center gap-1 text-emerald-600 mt-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-semibold">8%</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <TrendingUp className={`w-6 h-6 ${colors.text}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Revenue</p>
                <p className="text-3xl font-bold text-slate-900">€{domain.stats.revenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-emerald-600 mt-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-semibold">22%</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <DollarSign className={`w-6 h-6 ${colors.text}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${colors.text}`} />
            {domain.name} Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-700 hover:to-sky-800 gap-2">
              <Plus className="w-4 h-4" />
              New Listing
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <Eye className="w-4 h-4" />
              View All
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <Edit3 className="w-4 h-4" />
              Manage
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New booking received</p>
                  <p className="text-xs text-slate-600">2 hours ago</p>
                </div>
                <Badge variant="secondary">New</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Dashboard = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [userDomains, setUserDomains] = useState([]);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);

  // Fetch user domains and overview data
  useEffect(() => {
    if (isAuthenticated && user?.user_type === 'business') {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user domains and overview in parallel
      const [domainsResponse, overviewResponse] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/api/seller/domains/`),
        axios.get(`${config.API_BASE_URL}/api/seller/overview/`)
      ]);

      setUserDomains(domainsResponse.data.user_domains || []);
      setAvailableDomains(domainsResponse.data.available_domains || []);
      setOverview(overviewResponse.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (domainSlug) => {
    try {
      setAddingDomain(true);
      
      await axios.post(`${config.API_BASE_URL}/api/seller/domains/add/`, {
        domain: domainSlug,
        is_primary: userDomains.length === 0
      });

      // Refresh data
      await fetchDashboardData();
      setShowAddDomain(false);
    } catch (err) {
      console.error('Failed to add domain:', err);
      setError('Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleRemoveDomain = async (domainId) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/api/seller/domains/${domainId}/`);
      
      // Refresh data
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to remove domain:', err);
      setError('Failed to remove domain');
    }
  };

  const handleDomainNavigation = (domain) => {
    try {
      // Get the domain configuration from the registry
      const domainConfig = getDomainConfig(domain.id);
      
      // Navigate to the domain's home path
      if (domainConfig.homePath) {
        window.location.href = domainConfig.homePath;
      } else {
        console.error(`No homePath configured for domain: ${domain.id}`);
      }
    } catch (error) {
      console.error(`Failed to navigate to domain: ${domain.id}`, error);
      // Fallback to marketplace for unknown domains
      if (domain.id === 'marketplace') {
        window.location.href = '/dashboard/marketplace';
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-lime-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
                <Button 
                  onClick={fetchDashboardData}
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Marketplace Routes Component
  const MarketplaceRoutes = () => {
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

    return (
      <SellerDashboardLayout>
        <Routes>
          <Route 
            path="/" 
            element={
              <MarketplaceOverview 
                onNavigateToUpload={handleNavigateToUpload}
                onNavigateToAnalytics={handleNavigateToAnalytics}
                onNavigateToProducts={handleNavigateToProducts}
              />
            } 
          />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/products/upload" element={<ProductUploadForm />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/analytics" element={<SalesAnalytics />} />
        </Routes>
      </SellerDashboardLayout>
    );
  };

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/seller-inbox" element={<SellerInbox />} />
        <Route path="/marketplace/*" element={<MarketplaceRoutes />} />
      </Routes>
    </DashboardLayout>
  );

  // Main dashboard home component
  function DashboardHome() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Dashboard
              </h1>
              <p className="text-slate-600">
                Manage your {overview?.business_name || 'business'} across all domains
              </p>
            </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button onClick={fetchDashboardData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Overview KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="bg-gradient-to-br from-lime-50 to-emerald-50 border-lime-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Listings</p>
                  <p className="text-2xl font-bold text-slate-900">{overview?.total_listings || 0}</p>
                  <p className="text-xs text-lime-600 mt-1">↗ 15%</p>
                </div>
                <div className="w-12 h-12 bg-lime-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-lime-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Bookings</p>
                  <p className="text-2xl font-bold text-slate-900">{overview?.total_bookings || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">↗ 23%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(overview?.total_revenue || 0)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">↗ 18%</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Business Domains Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Business Domains</h2>
              <p className="text-slate-600 text-sm">
                {userDomains.length > 0 
                  ? `Managing ${userDomains.length} domain${userDomains.length > 1 ? 's' : ''}`
                  : 'No domains configured'
                }
              </p>
            </div>
            
            <Button 
              onClick={() => setShowAddDomain(true)}
              className="bg-lime-600 hover:bg-lime-700 text-white"
              disabled={availableDomains.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </div>

          {/* User's Active Domains */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {userDomains.map((domain, index) => {
                const IconComponent = DOMAIN_ICONS[domain.domain] || Building2;
                const colorClass = DOMAIN_COLORS[domain.domain] || 'gray';
                
                return (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="relative group hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-6">
                        {/* Remove button (only show if more than 1 domain) */}
                        {userDomains.length > 1 && (
                          <Button
                            onClick={() => handleRemoveDomain(domain.id)}
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {/* Primary badge */}
                        {domain.is_primary && (
                          <Badge className="absolute top-2 left-2 bg-lime-100 text-lime-800 border-lime-200">
                            Primary
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-3 mb-4 mt-6">
                          <div className={`w-12 h-12 bg-${colorClass}-100 rounded-xl flex items-center justify-center`}>
                            <IconComponent className={`w-6 h-6 text-${colorClass}-600`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{domain.domain_display_name}</h3>
                            <p className="text-sm text-slate-600">{domain.config?.description}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Listings</span>
                            <span className="font-medium">{domain.stats?.listings || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Bookings</span>
                            <span className="font-medium">{domain.stats?.bookings || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Revenue</span>
                            <span className="font-medium text-emerald-600">
                              {formatCurrency(domain.stats?.revenue || 0)}
                            </span>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4"
                          onClick={() => handleDomainNavigation({ id: domain.domain, name: domain.domain_display_name })}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Add Domain Modal */}
        <AnimatePresence>
          {showAddDomain && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddDomain(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Add Business Domain</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAddDomain(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableDomains.map((domain) => {
                    const IconComponent = DOMAIN_ICONS[domain.domain] || Building2;
                    const colorClass = DOMAIN_COLORS[domain.domain] || 'gray';
                    
                    return (
                      <Card 
                        key={domain.domain}
                        className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-lime-300"
                        onClick={() => handleAddDomain(domain.domain)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 bg-${colorClass}-100 rounded-lg flex items-center justify-center`}>
                              <IconComponent className={`w-5 h-5 text-${colorClass}-600`} />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900">{domain.name}</h4>
                              <p className="text-sm text-slate-600">{domain.config?.description}</p>
                            </div>
                          </div>
                          
                          {domain.config?.features && (
                            <div className="flex flex-wrap gap-1">
                              {domain.config.features.slice(0, 2).map((feature) => (
                                <Badge 
                                  key={feature} 
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  {feature.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {/* Add Marketplace Domain Option */}
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-lime-300"
                    onClick={() => handleAddDomain('marketplace')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">Marketplace</h4>
                          <p className="text-sm text-slate-600">E-commerce marketplace for products with categories and analytics</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">Product Management</Badge>
                        <Badge variant="secondary" className="text-xs">Sales Analytics</Badge>
                        <Badge variant="secondary" className="text-xs">Categories</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {addingDomain && (
                  <div className="flex items-center justify-center mt-6">
                    <Loader2 className="w-5 h-5 animate-spin text-lime-600 mr-2" />
                    <span className="text-slate-600">Adding domain...</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    );
  }
};

export default Dashboard;
