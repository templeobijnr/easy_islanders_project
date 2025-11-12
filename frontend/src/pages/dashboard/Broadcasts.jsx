import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Send,
  Eye,
  MessageCircle,
  Calendar,
  Trash2,
  Radio,
  CheckCircle,
  Search,
  Filter,
  X,
  Sparkles
} from 'lucide-react';
import { useBroadcasts } from '../../hooks/useSellerDashboard';

const Broadcasts = () => {
  const { broadcasts, loading, error, createBroadcast, publishBroadcast, deleteBroadcast } = useBroadcasts();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, draft
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: '',
    status: 'draft',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createBroadcast(formData);
      setShowCreateModal(false);
      setFormData({ title: '', message: '', category: '', status: 'draft' });
    } catch (err) {
      console.error('Failed to create broadcast:', err);
      alert('Failed to create broadcast. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm('Publish this broadcast? It will be visible to all users.')) return;
    try {
      await publishBroadcast(id);
    } catch (err) {
      alert('Failed to publish broadcast');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this broadcast? This action cannot be undone.')) return;
    try {
      await deleteBroadcast(id);
    } catch (err) {
      alert('Failed to delete broadcast');
    }
  };

  // Filter broadcasts
  const filteredBroadcasts = broadcasts.filter(broadcast => {
    const matchesSearch = !searchQuery ||
      broadcast.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broadcast.message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || broadcast.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: broadcasts.length,
    active: broadcasts.filter((b) => b.status === 'active').length,
    views: broadcasts.reduce((sum, b) => sum + (b.views_count || 0), 0),
    responses: broadcasts.reduce((sum, b) => sum + (b.response_count || 0), 0),
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

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Broadcasts</h1>
          <p className="text-slate-600">Send promotional messages to reach potential customers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-600 to-lime-500 text-white rounded-xl hover:from-lime-700 hover:to-lime-600 transition-all duration-200 font-semibold shadow-lg shadow-lime-600/30 hover:shadow-xl hover:shadow-lime-600/40 hover:scale-105"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>Create Broadcast</span>
        </button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div variants={item} className="group">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Radio className="w-6 h-6 text-blue-700" />
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
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Total Broadcasts</h3>
            <p className="text-xs text-blue-700">All messages created</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="group">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
              <motion.span
                className="text-4xl font-bold text-green-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                {stats.active}
              </motion.span>
            </div>
            <h3 className="text-sm font-semibold text-green-900 mb-1">Active</h3>
            <p className="text-xs text-green-700">Currently published</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="group">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Eye className="w-6 h-6 text-purple-700" />
              </div>
              <motion.span
                className="text-4xl font-bold text-purple-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
              >
                {stats.views}
              </motion.span>
            </div>
            <h3 className="text-sm font-semibold text-purple-900 mb-1">Total Views</h3>
            <p className="text-xs text-purple-700">Across all broadcasts</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="group">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-amber-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-6 h-6 text-amber-700" />
              </div>
              <motion.span
                className="text-4xl font-bold text-amber-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
              >
                {stats.responses}
              </motion.span>
            </div>
            <h3 className="text-sm font-semibold text-amber-900 mb-1">Responses</h3>
            <p className="text-xs text-amber-700">Customer replies</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search broadcasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 bg-white hover:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 bg-white hover:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
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
              <Radio className="w-12 h-12 text-lime-600 mb-4" />
            </motion.div>
            <p className="text-slate-600 font-medium">Loading broadcasts...</p>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 shadow-sm"
        >
          <p className="text-red-700 font-medium">{error}</p>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && filteredBroadcasts.length === 0 && (
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
            <Radio className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          </motion.div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            {searchQuery || statusFilter !== 'all' ? 'No matching broadcasts' : 'No broadcasts yet'}
          </h3>
          <p className="text-slate-600 mb-8">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first broadcast to reach potential customers'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-lime-600 to-lime-500 text-white rounded-xl hover:from-lime-700 hover:to-lime-600 transition-all duration-200 font-semibold shadow-lg shadow-lime-600/30 hover:shadow-xl hover:shadow-lime-600/40 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create First Broadcast
            </button>
          )}
        </motion.div>
      )}

      {/* Broadcasts List */}
      {!loading && filteredBroadcasts.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {filteredBroadcasts.map((broadcast, index) => (
            <motion.div
              key={broadcast.id}
              variants={item}
              whileHover={{ y: -4 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-lime-50 to-lime-100 rounded-lg">
                      <Radio className="w-5 h-5 text-lime-700" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{broadcast.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        broadcast.status === 'active'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : broadcast.status === 'draft'
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}
                    >
                      {broadcast.status === 'active' ? '● Active' : '○ Draft'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{broadcast.message}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Eye className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold">{broadcast.views_count || 0}</span>
                      <span>views</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MessageCircle className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold">{broadcast.response_count || 0}</span>
                      <span>responses</span>
                    </div>
                    {broadcast.published_at && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">
                          {new Date(broadcast.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {broadcast.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(broadcast.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-semibold shadow-lg shadow-green-600/30"
                    >
                      <Send className="w-4 h-4" />
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(broadcast.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-lime-100 rounded-xl">
                    <Sparkles className="w-6 h-6 text-lime-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Create New Broadcast</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Broadcast Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
                    placeholder="Enter a catchy title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message Content
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
                    placeholder="Write your broadcast message..."
                    rows={6}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {formData.message.length} characters
                  </p>
                </div>

                <div className="bg-lime-50 border border-lime-200 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.status === 'active'}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.checked ? 'active' : 'draft' })
                      }
                      className="w-5 h-5 text-lime-600 rounded focus:ring-lime-600"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-lime-900">Publish immediately</span>
                      <p className="text-xs text-lime-700">Broadcast will be visible to all customers</p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-600 to-lime-500 text-white rounded-xl hover:from-lime-700 hover:to-lime-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-lime-600/30"
                  >
                    {submitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Radio className="w-5 h-5" />
                        </motion.div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Create Broadcast
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Broadcasts;
