import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  MailOpen,
  Filter,
  Search,
  Eye,
  Send,
  Sparkles,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import HITLApprovalsList from '../../components/HITLApprovalsList';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const SellerInbox = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' | 'inbox'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, sent, pending

  // Load broadcast inbox items (RFQs that have already been sent)
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const resp = await fetch('/api/agent/seller/inbox/', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!resp.ok) {
          throw new Error('Failed to load inbox');
        }
        const data = await resp.json();
        if (mounted) {
          setItems(data.items || []);
        }
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  const filteredItems = items.filter(item => {
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = !searchQuery ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.request_id?.toString().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: items.length,
    sent: items.filter(i => i.status === 'sent').length,
    pending: items.filter(i => i.status === 'pending').length,
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!isAuthenticated) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium">Please log in to view your seller inbox.</p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Only show for business users
  if (user?.user_type !== 'business') {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
            <p className="text-foreground font-medium">This dashboard is for business users only.</p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-background/90 backdrop-blur rounded-2xl border border-border p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Seller Inbox</h1>
        <p className="text-muted-foreground">Manage buyer requests and broadcast responses</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <motion.div variants={item}>
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-primary/30 rounded-xl">
                  <Inbox className="w-6 h-6 text-primary" />
                </div>
                <motion.span
                  className="text-4xl font-bold text-foreground"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  {stats.total}
                </motion.span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Total Requests</h3>
              <p className="text-xs text-primary">All RFQs received</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-success/30 rounded-xl">
                  <Send className="w-6 h-6 text-success" />
                </div>
                <motion.span
                  className="text-4xl font-bold text-foreground"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                >
                  {stats.sent}
                </motion.span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Sent</h3>
              <p className="text-xs text-success">Broadcasts delivered</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-warning/30 rounded-xl">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <motion.span
                  className="text-4xl font-bold text-foreground"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.4 }}
                >
                  {stats.pending}
                </motion.span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Pending</h3>
              <p className="text-xs text-warning">Awaiting approval</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="inline-flex gap-2 mb-6"
      >
        <Card className="shadow-sm inline-flex gap-2 p-2">
          <Button variant={activeTab === 'approvals' ? 'premium' : 'ghost'} onClick={() => setActiveTab('approvals')} className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Pending Approvals
          </Button>
          <Button variant={activeTab === 'inbox' ? 'premium' : 'ghost'} onClick={() => setActiveTab('inbox')} className="gap-2">
            <Mail className="w-4 h-4" />
            Broadcast Inbox
          </Button>
        </Card>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <motion.div
            key="approvals"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <CardHeader className="flex items-center gap-3 p-0 mb-6">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>HITL Approvals</CardTitle>
                    <p className="text-sm text-muted-foreground">Review and approve buyer requests before broadcasting</p>
                  </div>
                </CardHeader>
                <HITLApprovalsList
                  isAuthenticated={isAuthenticated}
                  userType={user?.user_type}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Search & Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search by description or ID..."
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
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full pl-10 px-4 py-2.5 border border-input rounded-xl text-foreground bg-background hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none"
                        >
                          <option value="all">All Status</option>
                          <option value="sent">Sent</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Loading State */}
            {loading && (
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
                    <Mail className="w-12 h-12 text-primary mb-4" />
                  </motion.div>
                  <p className="text-muted-foreground font-medium">Loading broadcast results...</p>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-destructive font-semibold">Error Loading Inbox</p>
                    <p className="text-destructive text-sm mt-1">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="shadow-inner">
                  <CardContent className="p-16 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                    >
                      <MailOpen className="w-20 h-20 text-muted mx-auto mb-6" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      {searchQuery || filterStatus !== 'all' ? 'No matching requests' : 'No Broadcasts Yet'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterStatus !== 'all'
                        ? 'Try adjusting your filters'
                        : 'RFQs will appear here after they are approved and broadcast to sellers'
                      }
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Broadcast Items List */}
            {!loading && !error && filteredItems.length > 0 && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {filteredItems.map((broadcast, index) => (
                  <motion.div
                    key={broadcast.broadcast_id}
                    variants={item}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-foreground">
                                  RFQ #{broadcast.request_id}
                                </h3>
                                {broadcast.status === 'sent' ? (
                                  <Badge variant="success">SENT</Badge>
                                ) : broadcast.status === 'pending' ? (
                                  <Badge variant="warning">PENDING</Badge>
                                ) : (
                                  <Badge variant="secondary">{broadcast.status?.toUpperCase() || 'PENDING'}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {broadcast.description || 'Request for Quote'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted rounded-xl p-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Medium</p>
                            <p className="text-sm font-semibold text-foreground uppercase">
                              {broadcast.medium || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Sent Date</p>
                            <p className="text-sm font-semibold text-foreground">
                              {broadcast.sent_at
                                ? new Date(broadcast.sent_at).toLocaleDateString()
                                : 'Queued'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Broadcast ID</p>
                            <p className="text-sm font-mono text-foreground">
                              {broadcast.broadcast_id?.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="flex items-center justify-end">
                            <Button variant="premium" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerInbox;
