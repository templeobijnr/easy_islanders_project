import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  Calendar,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  Download,
  Eye,
  ArrowUpRight,
  Target,
  Award,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, completed, pending, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('all'); // all, today, week, month
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API call
      // const token = localStorage.getItem('token');
      // const response = await axios.get(`${config.API_BASE_URL}/api/sales/`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setSales(response.data.sales || []);

      // Mock sales data for now with more comprehensive fields
      const mockSales = [
        {
          id: 1,
          title: 'Luxury Apartment - Valletta Center',
          buyer: { name: 'John Doe', email: 'john@example.com', avatar: 'JD' },
          amount: 2500,
          commission: 250,
          date: '2025-10-21T10:30:00',
          status: 'completed',
          paymentMethod: 'Bank Transfer',
          category: 'Real Estate'
        },
        {
          id: 2,
          title: 'MacBook Pro M3',
          buyer: { name: 'Jane Smith', email: 'jane@example.com', avatar: 'JS' },
          amount: 1500,
          commission: 150,
          date: '2025-10-20T15:45:00',
          status: 'pending',
          paymentMethod: 'Credit Card',
          category: 'Electronics'
        },
        {
          id: 3,
          title: 'Vintage Vespa Scooter',
          buyer: { name: 'Mike Johnson', email: 'mike@example.com', avatar: 'MJ' },
          amount: 3200,
          commission: 320,
          date: '2025-10-19T09:15:00',
          status: 'completed',
          paymentMethod: 'Cash',
          category: 'Vehicles'
        },
        {
          id: 4,
          title: 'iPhone 15 Pro Max',
          buyer: { name: 'Sarah Williams', email: 'sarah@example.com', avatar: 'SW' },
          amount: 1200,
          commission: 120,
          date: '2025-10-18T14:20:00',
          status: 'completed',
          paymentMethod: 'PayPal',
          category: 'Electronics'
        },
        {
          id: 5,
          title: 'Office Space Sliema',
          buyer: { name: 'David Brown', email: 'david@example.com', avatar: 'DB' },
          amount: 4500,
          commission: 450,
          date: '2025-10-17T11:00:00',
          status: 'cancelled',
          paymentMethod: 'N/A',
          category: 'Real Estate'
        }
      ];
      setSales(mockSales);
      setError(null);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // Filter sales
  const filteredSales = sales.filter(sale => {
    const matchesFilter = filter === 'all' || sale.status === filter;
    const matchesSearch =
      !searchQuery ||
      sale.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate stats
  const stats = {
    totalRevenue: sales.reduce((sum, sale) => sale.status === 'completed' ? sum + sale.amount : sum, 0),
    totalCommission: sales.reduce((sum, sale) => sale.status === 'completed' ? sum + sale.commission : sum, 0),
    completedSales: sales.filter(s => s.status === 'completed').length,
    pendingSales: sales.filter(s => s.status === 'pending').length,
    cancelledSales: sales.filter(s => s.status === 'cancelled').length,
    totalSales: sales.length,
    avgSaleValue: sales.filter(s => s.status === 'completed').length > 0
      ? sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0) / sales.filter(s => s.status === 'completed').length
      : 0
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Sales</h1>
        <p className="text-slate-600 mb-8">Track your sales and revenue</p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-24"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <ShoppingCart className="w-12 h-12 text-primary mb-4" />
            </motion.div>
            <p className="text-muted-foreground font-medium">Loading sales data...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sales Dashboard</h1>
          <p className="text-slate-600">Track revenue, transactions, and performance</p>
        </div>
        <Button className="group bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-700 hover:to-sky-800 text-white">
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </Button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 flex items-center gap-4 mb-6 shadow-sm"
        >
          <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-destructive font-medium">{error}</p>
          </div>
          <Button
            onClick={fetchSales}
            variant="destructive"
            className="px-4 py-2"
          >
            Retry
          </Button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div variants={item}>
          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-success/30 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-success/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex items-center gap-1 text-success text-sm font-semibold">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+12.5%</span>
                  </div>
                </div>
                <motion.p
                  className="text-3xl font-bold text-foreground mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  €{stats.totalRevenue.toLocaleString()}
                </motion.p>
                <h3 className="text-sm font-semibold text-foreground mb-1">Total Revenue</h3>
                <p className="text-xs text-success">From completed sales</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-primary/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 text-primary text-sm font-semibold">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <motion.p
                  className="text-3xl font-bold text-foreground mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                >
                  {stats.completedSales}
                </motion.p>
                <h3 className="text-sm font-semibold text-foreground mb-1">Completed Sales</h3>
                <p className="text-xs text-primary">Successfully closed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-warning/30 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-warning/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                  <div className="flex items-center gap-1 text-warning text-sm font-semibold">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <motion.p
                  className="text-3xl font-bold text-foreground mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.4 }}
                >
                  {stats.pendingSales}
                </motion.p>
                <h3 className="text-sm font-semibold text-foreground mb-1">Pending Sales</h3>
                <p className="text-xs text-warning">Awaiting completion</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/30 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-500/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6 text-purple-700" />
                  </div>
                  <div className="flex items-center gap-1 text-purple-700 text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <motion.p
                  className="text-3xl font-bold text-foreground mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.5 }}
                >
                  €{stats.avgSaleValue.toFixed(0)}
                </motion.p>
                <h3 className="text-sm font-semibold text-foreground mb-1">Avg. Sale Value</h3>
                <p className="text-xs text-purple-700">Per transaction</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-sm">
          <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, buyer, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-input rounded-xl text-foreground bg-background hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 px-4 py-2.5 border border-input rounded-xl text-foreground bg-background hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none"
              >
                <option value="all">All Sales</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Time Range</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full pl-10 px-4 py-2.5 border border-input rounded-xl text-foreground bg-background hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      </CardContent>
      </Card>
      </motion.div>

      {/* Sales Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="bg-muted">
            <CardTitle className="flex items-center justify-between">
              Recent Transactions
              <span className="text-sm text-muted-foreground font-normal">{filteredSales.length} sales</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Buyer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Commission</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence>
                {filteredSales.map((sale, index) => (
                  <motion.tr
                    key={sale.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg group-hover:scale-110 transition-transform">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{sale.title}</p>
                          <p className="text-xs text-muted-foreground">{sale.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {sale.buyer.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{sale.buyer.name}</p>
                          <p className="text-xs text-muted-foreground">{sale.buyer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-foreground">€{sale.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{sale.paymentMethod}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-primary">€{sale.commission}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{new Date(sale.date).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(sale.date).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      {sale.status === 'completed' && <Badge variant="success" className="gap-1.5"><CheckCircle2 className="w-3 h-3" />completed</Badge>}
                      {sale.status === 'pending' && <Badge variant="warning" className="gap-1.5"><Clock className="w-3 h-3" />pending</Badge>}
                      {sale.status === 'cancelled' && <Badge variant="destructive" className="gap-1.5"><XCircle className="w-3 h-3" />cancelled</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedSale(sale)} title="View Details">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredSales.length === 0 && (
            <div className="py-16 text-center">
              <ShoppingCart className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No sales found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </CardContent>
      </Card>
      </motion.div>

      {/* Sale Details Modal */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl border border-primary/30">
                <h3 className="text-xl font-bold text-foreground mb-2">{selectedSale.title}</h3>
                <div className="flex items-center gap-4 text-sm">
                  {selectedSale.status === 'completed' && <Badge variant="success">{selectedSale.status}</Badge>}
                  {selectedSale.status === 'pending' && <Badge variant="warning">{selectedSale.status}</Badge>}
                  {selectedSale.status === 'cancelled' && <Badge variant="destructive">{selectedSale.status}</Badge>}
                  <span className="text-muted-foreground">{selectedSale.category}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Buyer</label>
                  <p className="text-foreground font-semibold">{selectedSale.buyer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSale.buyer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Payment Method</label>
                  <p className="text-foreground font-semibold">{selectedSale.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Sale Amount</label>
                  <p className="text-2xl font-bold text-foreground">€{selectedSale.amount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Your Commission</label>
                  <p className="text-2xl font-bold text-primary">€{selectedSale.commission}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Transaction Date</label>
                  <p className="text-foreground font-semibold">
                    {new Date(selectedSale.date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
