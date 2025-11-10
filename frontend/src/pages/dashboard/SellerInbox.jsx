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
  MessageSquare,
  User,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Send,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import HITLApprovalsList from '../../components/HITLApprovalsList';

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
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center"
        >
          <AlertCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">Please log in to view your seller inbox.</p>
        </motion.div>
      </div>
    );
  }

  // Only show for business users
  if (user?.user_type !== 'business') {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center"
        >
          <AlertCircle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">This dashboard is for business users only.</p>
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
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Seller Inbox</h1>
        <p className="text-slate-600">Manage buyer requests and broadcast responses</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <motion.div variants={item}>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-200 rounded-xl">
                <Inbox className="w-6 h-6 text-blue-700" />
              </div>
              <motion.span
                className="text-4xl font-bold text-blue-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                {stats.total}
              </motion.span>
            </div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Total Requests</h3>
            <p className="text-xs text-blue-700">All RFQs received</p>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-200 rounded-xl">
                <Send className="w-6 h-6 text-green-700" />
              </div>
              <motion.span
                className="text-4xl font-bold text-green-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                {stats.sent}
              </motion.span>
            </div>
            <h3 className="text-sm font-semibold text-green-900 mb-1">Sent</h3>
            <p className="text-xs text-green-700">Broadcasts delivered</p>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-amber-200 rounded-xl">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
              <motion.span
                className="text-4xl font-bold text-amber-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
              >
                {stats.pending}
              </motion.span>
            </div>
            <h3 className="text-sm font-semibold text-amber-900 mb-1">Pending</h3>
            <p className="text-xs text-amber-700">Awaiting approval</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-slate-200 rounded-2xl p-2 mb-6 shadow-sm inline-flex gap-2"
      >
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'approvals'
              ? 'bg-gradient-to-r from-lime-600 to-lime-500 text-white shadow-lg shadow-lime-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Pending Approvals</span>
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'inbox'
              ? 'bg-gradient-to-r from-lime-600 to-lime-500 text-white shadow-lg shadow-lime-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Broadcast Inbox</span>
        </button>
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-lime-100 rounded-xl">
                  <Sparkles className="w-6 h-6 text-lime-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">HITL Approvals</h2>
                  <p className="text-sm text-slate-600">Review and approve buyer requests before broadcasting</p>
                </div>
              </div>
              <HITLApprovalsList
                isAuthenticated={isAuthenticated}
                userType={user?.user_type}
              />
            </div>
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
              className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by description or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 bg-white hover:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full pl-10 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 bg-white hover:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all appearance-none"
                    >
                      <option value="all">All Status</option>
                      <option value="sent">Sent</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
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
                    <Mail className="w-12 h-12 text-lime-600 mb-4" />
                  </motion.div>
                  <p className="text-slate-600 font-medium">Loading broadcast results...</p>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-900 font-semibold">Error Loading Inbox</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-16 text-center shadow-inner"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  <MailOpen className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  {searchQuery || filterStatus !== 'all' ? 'No matching requests' : 'No Broadcasts Yet'}
                </h3>
                <p className="text-slate-600">
                  {searchQuery || filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'RFQs will appear here after they are approved and broadcast to sellers'
                  }
                </p>
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
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-lime-50 to-lime-100 rounded-xl">
                          <FileText className="w-6 h-6 text-lime-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-slate-900">
                              RFQ #{broadcast.request_id}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                broadcast.status === 'sent'
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : broadcast.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {broadcast.status?.toUpperCase() || 'PENDING'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">
                            {broadcast.description || 'Request for Quote'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-xl p-4">
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">Medium</p>
                        <p className="text-sm font-semibold text-slate-900 uppercase">
                          {broadcast.medium || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">Sent Date</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {broadcast.sent_at
                            ? new Date(broadcast.sent_at).toLocaleDateString()
                            : 'Queued'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">Broadcast ID</p>
                        <p className="text-sm font-mono text-slate-900">
                          {broadcast.broadcast_id?.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="flex items-center justify-end">
                        <button className="flex items-center gap-2 px-4 py-2 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition-colors shadow-lg shadow-lime-600/30">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-semibold">View</span>
                        </button>
                      </div>
                    </div>
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
