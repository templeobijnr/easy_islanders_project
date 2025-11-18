import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Upload,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

interface MarketplaceOverviewProps {
  onNavigateToUpload?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToProducts?: () => void;
}

const MarketplaceOverview: React.FC<MarketplaceOverviewProps> = ({ 
  onNavigateToUpload,
  onNavigateToAnalytics,
  onNavigateToProducts
}) => {
  const stats = [
    {
      title: 'Total Products',
      value: '156',
      change: '+12%',
      trend: 'up',
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Active Orders',
      value: '23',
      change: '+5%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'green'
    },
    {
      title: 'Revenue',
      value: '€45,600',
      change: '+22%',
      trend: 'up',
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: 'Customers',
      value: '892',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'purple'
    }
  ];

  const recentProducts = [
    {
      id: 1,
      name: 'Wireless Headphones',
      category: 'Electronics',
      price: '€89.99',
      status: 'active',
      sales: 12,
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20wireless%20headphones%20with%20sleek%20design%20on%20white%20background&image_size=square'
    },
    {
      id: 2,
      name: 'Organic Cotton T-Shirt',
      category: 'Fashion',
      price: '€24.99',
      status: 'active',
      sales: 8,
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Organic%20cotton%20t-shirt%20folded%20neatly%20on%20white%20background&image_size=square'
    },
    {
      id: 3,
      name: 'Smart Home Hub',
      category: 'Electronics',
      price: '€149.99',
      status: 'draft',
      sales: 0,
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Smart%20home%20hub%20device%20modern%20design%20white%20background&image_size=square'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      emerald: 'bg-emerald-100 text-emerald-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Marketplace Dashboard
          </h1>
          <p className="text-slate-600">
            Manage your e-commerce business and track performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={onNavigateToUpload}
            className="bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-700 hover:to-sky-800 gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Product
          </Button>
          <Button 
            onClick={onNavigateToAnalytics}
            variant="outline"
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-semibold ${
                        stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={onNavigateToUpload}
                className="w-full bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-700 hover:to-sky-800 gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Product
              </Button>
              <Button 
                onClick={onNavigateToProducts}
                variant="outline" 
                className="w-full gap-2"
              >
                <Package className="w-4 h-4" />
                Manage Products
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <Eye className="w-4 h-4" />
                View Inventory
              </Button>
              <Button 
                onClick={onNavigateToAnalytics}
                variant="outline" 
                className="w-full gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Sales Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-600">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{product.price}</p>
                    <p className="text-xs text-slate-600">{product.sales} sales</p>
                  </div>
                  <Badge 
                    variant={product.status === 'active' ? 'default' : 'secondary'}
                    className={product.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {product.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MarketplaceOverview;