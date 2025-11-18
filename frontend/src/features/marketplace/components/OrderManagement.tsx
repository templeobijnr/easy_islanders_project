import React, { useState } from 'react';
import { motion, AnimatePresence as FMAnimatePresence } from 'framer-motion';

// Type-safe wrapper for AnimatePresence to fix TypeScript issues with framer-motion v11
const AnimatePresence = FMAnimatePresence as React.ComponentType<React.PropsWithChildren<{ mode?: "wait" | "sync" }>>;
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  User,
  DollarSign,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Mail,
  Phone,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  createdAt: string;
  updatedAt: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  trackingNumber?: string;
  notes?: string;
}

interface OrderManagementProps {
  onUpdateOrderStatus?: (orderId: string, status: Order['status']) => void;
  onUpdatePaymentStatus?: (orderId: string, status: Order['paymentStatus']) => void;
  onViewOrderDetails?: (order: Order) => void;
}

const OrderManagement: React.FC<OrderManagementProps> = ({
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onViewOrderDetails
}) => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      customer: {
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+1 234-567-8901',
        address: '123 Main St, New York, NY 10001'
      },
      items: [
        {
          id: '1',
          name: 'Wireless Headphones Pro',
          quantity: 1,
          price: 189.99,
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Premium%20wireless%20headphones%20sleek%20design%20black%20color%20professional%20look&image_size=square'
        },
        {
          id: '2',
          name: 'Phone Case Premium',
          quantity: 2,
          price: 24.99,
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Premium%20phone%20case%20sleek%20design%20black%20color%20modern%20style&image_size=square'
        }
      ],
      status: 'processing',
      total: 239.97,
      subtotal: 214.98,
      tax: 19.99,
      shipping: 5.00,
      createdAt: '2024-01-20T10:30:00Z',
      updatedAt: '2024-01-20T14:15:00Z',
      paymentMethod: 'Credit Card',
      paymentStatus: 'paid',
      trackingNumber: 'TRK123456789'
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      customer: {
        name: 'Michael Chen',
        email: 'm.chen@email.com',
        phone: '+1 345-678-9012',
        address: '456 Oak Ave, Los Angeles, CA 90001'
      },
      items: [
        {
          id: '3',
          name: 'Smart Watch Ultra',
          quantity: 1,
          price: 399.99,
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Smart%20watch%20ultra%20modern%20design%20black%20color%20sleek%20appearance&image_size=square'
        }
      ],
      status: 'shipped',
      total: 439.99,
      subtotal: 399.99,
      tax: 35.00,
      shipping: 5.00,
      createdAt: '2024-01-19T15:45:00Z',
      updatedAt: '2024-01-20T09:30:00Z',
      paymentMethod: 'PayPal',
      paymentStatus: 'paid',
      trackingNumber: 'TRK987654321'
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      customer: {
        name: 'Emma Wilson',
        email: 'emma.w@email.com',
        phone: '+1 456-789-0123',
        address: '789 Pine Rd, Chicago, IL 60601'
      },
      items: [
        {
          id: '4',
          name: 'Laptop Stand Adjustable',
          quantity: 1,
          price: 79.99,
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Adjustable%20laptop%20stand%20aluminum%20silver%20color%20modern%20design&image_size=square'
        }
      ],
      status: 'pending',
      total: 87.99,
      subtotal: 79.99,
      tax: 6.00,
      shipping: 2.00,
      createdAt: '2024-01-21T08:15:00Z',
      updatedAt: '2024-01-21T08:15:00Z',
      paymentMethod: 'Credit Card',
      paymentStatus: 'pending'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const getStatusBadge = (status: Order['status']) => {
    const variants = {
      pending: { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { className: 'bg-blue-100 text-blue-800', icon: Package },
      shipped: { className: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { className: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      cancelled: { className: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const variant = variants[status];
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    const variants = {
      pending: { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { className: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      refunded: { className: 'bg-orange-100 text-orange-800', icon: RefreshCw },
      failed: { className: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const variant = variants[status];
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
    ));
    onUpdateOrderStatus?.(orderId, newStatus);
  };

  const handlePaymentStatusUpdate = (orderId: string, newStatus: Order['paymentStatus']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, paymentStatus: newStatus, updatedAt: new Date().toISOString() } : order
    ));
    onUpdatePaymentStatus?.(orderId, newStatus);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Management</h1>
          <p className="text-slate-600">Track and manage customer orders</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button className="bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-700 hover:to-sky-800 gap-2">
            <Package className="w-4 h-4" />
            New Order
          </Button>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
                <div className="flex items-center gap-1 text-emerald-600 mt-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-semibold">+12%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Processing</p>
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter(o => o.status === 'processing').length}
                </p>
                <p className="text-xs text-slate-600 mt-1">Awaiting fulfillment</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Revenue</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
                </p>
                <div className="flex items-center gap-1 text-emerald-600 mt-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-semibold">+18%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-100">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg. Order</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0) / orders.length)}
                </p>
                <p className="text-xs text-slate-600 mt-1">Per order</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
            
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">{order.orderNumber}</h3>
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.customer.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.customer.address.split(',')[1]?.trim() || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewOrderDetails?.(order)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handleStatusUpdate(order.id, status as Order['status'])}
                            disabled={order.status === status}
                          >
                            {order.status === status && <CheckCircle className="w-3 h-3 mr-2" />}
                            Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Payment</DropdownMenuLabel>
                        {['paid', 'pending', 'refunded', 'failed'].map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => handlePaymentStatusUpdate(order.id, status as Order['paymentStatus'])}
                            disabled={order.paymentStatus === status}
                          >
                            {order.paymentStatus === status && <CheckCircle className="w-3 h-3 mr-2" />}
                            Payment: {status.charAt(0).toUpperCase() + status.slice(1)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Items Preview */}
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <img
                          key={item.id}
                          src={item.image}
                          alt={item.name}
                          className="w-8 h-8 rounded-full border-2 border-white object-cover"
                          style={{ zIndex: 3 - index }}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-slate-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-slate-600 ml-auto">
                      {formatCurrency(order.total)}
                    </div>
                  </div>
                  
                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-slate-900 mb-1">Customer</p>
                      <p className="text-slate-600">{order.customer.name}</p>
                      <p className="text-slate-600">{order.customer.email}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 mb-1">Payment</p>
                      <p className="text-slate-600">{order.paymentMethod}</p>
                      {order.trackingNumber && (
                        <p className="text-slate-600">Track: {order.trackingNumber}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 mb-1">Amount</p>
                      <p className="text-slate-900 font-semibold">{formatCurrency(order.total)}</p>
                      <p className="text-slate-600">Updated: {formatDate(order.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {filteredOrders.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderManagement;
