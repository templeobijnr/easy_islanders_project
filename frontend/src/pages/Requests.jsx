import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, MapPin, DollarSign, MessageSquare,
  X, Loader2, AlertCircle, CheckCircle, Clock, Send
} from 'lucide-react';
import Page from '../shared/components/Page';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config';

// Category icon mapping
const categoryIcons = {
  'Real Estate': '🏠',
  'Vehicles': '🚗',
  'Services': '🛠️',
  'Entertainment': '🎵',
  'Tourism': '✈️',
  'default': '📋'
};

// Category gradient mapping
const categoryGradients = {
  'Real Estate': 'from-blue-500 to-blue-600',
  'Vehicles': 'from-orange-500 to-orange-600',
  'Services': 'from-purple-500 to-purple-600',
  'Entertainment': 'from-pink-500 to-pink-600',
  'Tourism': 'from-green-500 to-green-600',
  'default': 'from-slate-500 to-slate-600'
};

const Requests = () => {
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, fulfilled
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    message: '',
    location: '',
    budget: '',
    currency: 'EUR'
  });

  // Fetch requests
  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
      fetchCategories();
    }
  }, [isAuthenticated]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${config.API_BASE_URL}/api/buyer-requests/my-requests/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showMessage('error', 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/categories/`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateRequest = async () => {
    if (!formData.category || !formData.message) {
      showMessage('error', 'Please fill in category and message');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');

      const payload = {
        category: formData.category,
        message: formData.message,
        location: formData.location,
        currency: formData.currency
      };

      // Only include budget if provided
      if (formData.budget) {
        payload.budget = parseFloat(formData.budget);
      }

      await axios.post(
        `${config.API_BASE_URL}/api/buyer-requests/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Request created successfully!');
      setShowCreateModal(false);
      setFormData({
        category: '',
        message: '',
        location: '',
        budget: '',
        currency: 'EUR'
      });
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      showMessage('error', error.response?.data?.error || 'Failed to create request');
    } finally {
      setCreating(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !request.is_fulfilled;
    if (filter === 'fulfilled') return request.is_fulfilled;
    return true;
  });

  const getCategoryIcon = (categoryName) => {
    return categoryIcons[categoryName] || categoryIcons.default;
  };

  const getCategoryGradient = (categoryName) => {
    return categoryGradients[categoryName] || categoryGradients.default;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isAuthenticated) {
    return (
      <Page title="My Requests">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] bg-white/90 backdrop-blur p-8 rounded-2xl border border-slate-200 shadow-sm"
        >
          <AlertCircle className="w-16 h-16 text-lime-600 mb-4" />
          <h1 className="text-2xl font-bold text-ink-700 mb-2">Authentication Required</h1>
          <p className="text-ink-500 text-center">
            Please log in to view and manage your requests.
          </p>
        </motion.div>
      </Page>
    );
  }

  return (
    <Page title="My Requests">
      {/* Success/Error Message */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-lime-600 flex items-center justify-center shadow-sm">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-700">My Requests</h1>
            <p className="text-ink-500 text-sm">Manage your service and product requests</p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-lime-600 text-white px-4 py-2.5 rounded-xl hover:bg-lime-700 transition-colors shadow-sm font-semibold"
        >
          <Plus className="w-5 h-5" />
          New Request
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6"
      >
        {[
          { id: 'all', label: 'All Requests' },
          { id: 'pending', label: 'Pending' },
          { id: 'fulfilled', label: 'Fulfilled' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === tab.id
                ? 'bg-lime-600 text-white shadow-sm'
                : 'bg-white text-ink-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Requests List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white/90 backdrop-blur rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-lime-600 animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/90 backdrop-blur rounded-2xl border border-slate-200">
            <ClipboardList className="w-16 h-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-ink-700 mb-2">No Requests Found</h2>
            <p className="text-ink-500 text-center mb-6">
              {filter === 'all'
                ? "You haven't created any requests yet."
                : `No ${filter} requests found.`}
            </p>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 bg-lime-600 text-white px-6 py-3 rounded-xl hover:bg-lime-700 transition-colors shadow-sm font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create Your First Request
            </motion.button>
          </div>
        ) : (
          filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-white/90 backdrop-blur p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Category Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryGradient(request.category_name)} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                  {getCategoryIcon(request.category_name)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-ink-700 mb-1">
                        {request.category_name || 'General Request'}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-ink-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(request.created_at)}
                        </span>
                        {request.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {request.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      request.is_fulfilled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {request.is_fulfilled ? '✓ Fulfilled' : '⏳ Pending'}
                    </span>
                  </div>

                  <p className="text-ink-600 mb-4 leading-relaxed">
                    {request.message}
                  </p>

                  <div className="flex items-center gap-4">
                    {request.budget && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-lime-50 rounded-lg">
                        <DollarSign className="w-4 h-4 text-lime-600" />
                        <span className="text-sm font-semibold text-lime-700">
                          Budget: {request.currency} {parseFloat(request.budget).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {request.response_count > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">
                          {request.response_count} {request.response_count === 1 ? 'Response' : 'Responses'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Create Request Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !creating && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-ink-700">Create New Request</h2>
                <button
                  onClick={() => !creating && setShowCreateModal(false)}
                  disabled={creating}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6 text-ink-600" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Request Details *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Describe what you're looking for in detail..."
                    rows={4}
                    className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-ink-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Kyrenia, Famagusta"
                      className="w-full bg-gray-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Budget and Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Budget
                    </label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-3 text-ink-700 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent transition-all"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="TRY">TRY (₺)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => !creating && setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 px-6 py-3 border border-slate-200 text-ink-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleCreateRequest}
                  disabled={creating}
                  whileHover={{ scale: creating ? 1 : 1.02 }}
                  whileTap={{ scale: creating ? 1 : 0.98 }}
                  className="flex-1 bg-lime-600 text-white px-6 py-3 rounded-xl hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors shadow-sm"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Create Request
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
};

export default Requests;
