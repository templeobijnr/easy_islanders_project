import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Car, 
  Calendar, 
  Wrench, 
  Users, 
  ShoppingBag, 
  Utensils, 
  Heart,
  TrendingUp,
  Star,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

interface BusinessDomain {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  features: string[];
  stats: {
    listings: string;
    revenue: string;
    growth: string;
  };
  path: string;
}

const businessDomains: BusinessDomain[] = [
  {
    id: 'real-estate',
    title: 'Real Estate',
    description: 'Manage properties, rentals, and real estate investments',
    icon: <Home className="w-8 h-8" />,
    color: 'ocean',
    gradient: 'from-ocean-500 to-ocean-600',
    features: ['Property Management', 'Rental Tracking', 'Tenant Portal', 'Maintenance Requests'],
    stats: { listings: '2,847', revenue: '$1.2M', growth: '+23%' },
    path: '/dashboard/home/real-estate'
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Sell products, manage inventory, and track sales',
    icon: <ShoppingBag className="w-8 h-8" />,
    color: 'ocean',
    gradient: 'from-ocean-500 to-ocean-600',
    features: ['Product Listings', 'Inventory Management', 'Order Tracking', 'Customer Reviews'],
    stats: { listings: '15,234', revenue: '$890K', growth: '+45%' },
    path: '/dashboard/home/products'
  },
  {
    id: 'cars',
    title: 'Vehicles',
    description: 'Sell and rent vehicles with comprehensive management',
    icon: <Car className="w-8 h-8" />,
    color: 'ocean',
    gradient: 'from-ocean-500 to-ocean-600',
    features: ['Vehicle Sales', 'Rental Management', 'Fleet Tracking', 'Maintenance Scheduling'],
    stats: { listings: '1,456', revenue: '$2.1M', growth: '+18%' },
    path: '/dashboard/home/cars'
  },
  {
    id: 'events',
    title: 'Events',
    description: 'Host events, manage bookings, and sell tickets',
    icon: <Calendar className="w-8 h-8" />,
    color: 'ocean',
    gradient: 'from-ocean-500 to-ocean-600',
    features: ['Event Planning', 'Ticket Sales', 'Venue Management', 'Attendee Tracking'],
    stats: { listings: '892', revenue: '$567K', growth: '+67%' },
    path: '/dashboard/home/events'
  },
  {
    id: 'services',
    title: 'Services',
    description: 'Offer services, manage bookings, and track appointments',
    icon: <Wrench className="w-8 h-8" />,
    color: 'ocean',
    gradient: 'from-ocean-500 to-ocean-600',
    features: ['Service Booking', 'Appointment Scheduling', 'Customer Management', 'Payment Processing'],
    stats: { listings: '3,241', revenue: '$445K', growth: '+34%' },
    path: '/dashboard/home/services'
  },
  {
    id: 'restaurants',
    title: 'Restaurants',
    description: 'Manage restaurant operations, reservations, and menu',
    icon: <Utensils className="w-8 h-8" />,
    color: 'ocean',
    gradient: 'from-ocean-500 to-ocean-600',
    features: ['Table Reservations', 'Menu Management', 'Order Processing', 'Customer Reviews'],
    stats: { listings: '567', revenue: '$1.8M', growth: '+12%' },
    path: '/dashboard/home/restaurants'
  },
  {
    id: 'health-beauty',
    title: 'Health & Beauty',
    description: 'Manage wellness services, appointments, and client care',
    icon: <Heart className="w-8 h-8" />,
    color: 'ocean',
    gradient: 'from-ocean-500 to-ocean-600',
    features: ['Appointment Booking', 'Client Management', 'Service Packages', 'Wellness Tracking'],
    stats: { listings: '1,234', revenue: '$678K', growth: '+28%' },
    path: '/dashboard/health-beauty'
  },
  {
    id: 'p2p',
    title: 'Peer-to-Peer',
    description: 'Connect buyers and sellers in your community',
    icon: <Users className="w-8 h-8" />,
    color: 'ocean',
    gradient: 'from-ocean-500 to-ocean-600',
    features: ['Community Marketplace', 'Direct Messaging', 'Secure Payments', 'Local Discovery'],
    stats: { listings: '8,901', revenue: '$234K', growth: '+89%' },
    path: '/dashboard/home/p2p'
  }
];

const DashboardHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDomainClick = (domain: BusinessDomain) => {
    navigate(domain.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.name || 'Business Owner'}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Choose your business domain to manage your operations
              </p>
            </div>
            <Button className="bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Business
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-ocean-500 to-ocean-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Revenue</p>
                  <p className="text-2xl font-bold">$7.2M</p>
                  <p className="text-blue-100 text-sm">+24% from last month</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-sand-500 to-sand-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Active Listings</p>
                  <p className="text-2xl font-bold">33,372</p>
                  <p className="text-green-100 text-sm">+18% from last month</p>
                </div>
                <Star className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-ocean-500 to-ocean-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Active Businesses</p>
                  <p className="text-2xl font-bold">{businessDomains.length}</p>
                  <p className="text-purple-100 text-sm">All domains active</p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-sunset-500 to-sunset-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Growth Rate</p>
                  <p className="text-2xl font-bold">+32%</p>
                  <p className="text-orange-100 text-sm">Year over year</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Domains Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Your Business Domains
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {businessDomains.map((domain, index) => (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                  onClick={() => handleDomainClick(domain)}
                >
                  <CardHeader className={`bg-gradient-to-r ${domain.gradient} text-white pb-6`}>
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        {domain.icon}
                      </div>
                      <ArrowRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardTitle className="text-white mt-4 text-lg">{domain.title}</CardTitle>
                    <CardDescription className="text-white opacity-90 text-sm">
                      {domain.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Listings</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{domain.stats.listings}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Revenue</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{domain.stats.revenue}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Growth</span>
                        <span className={`text-sm font-semibold ${
                          domain.stats.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {domain.stats.growth}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Key Features:</p>
                        <div className="flex flex-wrap gap-1">
                          {domain.features.slice(0, 2).map((feature, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-sand-100 dark:bg-sand-800 text-xs rounded-full text-sand-700 dark:text-sand-200"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Add New Listing</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Create a new listing in any domain</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">View Analytics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Check your business performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Manage Customers</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">View and manage your customers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHomePage;
