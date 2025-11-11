import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Eye, ShoppingBag, MessageCircle, Star, Award, Calendar, Target, Sparkles } from 'lucide-react';
import { useSellerAnalytics } from '../../hooks/useSellerDashboard';
import { CATEGORY_DESIGN, getCategoryIcon, getCategoryGradient } from '../../lib/categoryDesign';

const Analytics = () => {
  const { analytics, loading, error, refetch } = useSellerAnalytics();

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Analytics</h1>
        <p className="text-slate-600 mb-8">Track your business performance</p>
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <TrendingUp className="w-8 h-8 text-lime-600" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Analytics</h1>
        <p className="text-slate-600 mb-8">Track your business performance</p>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = analytics?.stats || {};
  const categoryBreakdown = analytics?.category_breakdown || {};
  const trends = analytics?.trends || {};
  const insights = analytics?.insights || [];

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Analytics</h1>
          <p className="text-slate-600">Track your business performance</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div>
        {/* AI Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-5 h-5 text-blue-600" />
              </motion.div>
              AI-Powered Insights
            </h3>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-gray-700"
                >
                  {insight}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Views</p>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-3xl font-bold text-blue-900 mt-1"
                >
                  {stats.total_views || 0}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Eye className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-blue-600 font-medium">Across all listings</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Listings</p>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  className="text-3xl font-bold text-green-900 mt-1"
                >
                  {stats.total_listings || 0}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-green-600 font-semibold">
                {stats.active_listings || 0} active
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Pending Requests</p>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  className="text-3xl font-bold text-purple-900 mt-1"
                >
                  {stats.pending_requests || 0}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-purple-600 font-medium">Waiting for response</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200 shadow-sm cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Average Rating</p>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                  className="text-3xl font-bold text-yellow-900 mt-1"
                >
                  {stats.avg_rating?.toFixed(1) || '0.0'}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <Star className="w-7 h-7 text-white fill-white" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-yellow-600 font-medium">Out of 5.0</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <Target className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.conversion_rate?.toFixed(1) || 0}%</p>
            <p className="text-xs text-gray-500 mt-1">Requests to listings ratio</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Broadcasts</p>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total_broadcasts || 0}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.active_broadcasts || 0} active · {stats.broadcast_views || 0} views
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Broadcast Responses</p>
              <MessageCircle className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.broadcast_responses || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Total engagement</p>
          </div>
        </div>

        {/* Category Breakdown - Enhanced with Multi-Domain Design */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Category Distribution</h3>
              <p className="text-sm text-gray-600 mt-1">Your listings across different categories</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {Object.entries(categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([categoryName, count], index) => {
                    const total = Object.values(categoryBreakdown).reduce((sum, c) => sum + c, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;

                    // Find matching category design (case-insensitive match)
                    const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
                    const categoryDesign = Object.values(CATEGORY_DESIGN).find(
                      cat => cat.name.toLowerCase() === categoryName.toLowerCase() ||
                             cat.slug === categorySlug
                    );

                    const CategoryIcon = categoryDesign?.icon || ShoppingBag;
                    const gradient = categoryDesign?.gradient || 'from-gray-500 to-gray-600';
                    const badgeBg = categoryDesign?.badgeBg || 'bg-gray-100';
                    const badgeText = categoryDesign?.badgeText || 'text-gray-700';

                    return (
                      <motion.div
                        key={categoryName}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                              <CategoryIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">{categoryName}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${badgeBg} ${badgeText} font-medium`}>
                                  {count} {count === 1 ? 'listing' : 'listings'}
                                </span>
                                <span className="text-xs text-gray-500">·</span>
                                <span className="text-xs text-gray-600 font-medium">{percentage.toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.7 + index * 0.1, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${gradient} rounded-full shadow-sm`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Performance Trends */}
        {trends && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Performance Trends</h3>
              <p className="text-sm text-gray-600 mt-1">
                Last {trends.period_days || 30} days
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">New Listings</p>
                  <p className="text-3xl font-bold text-gray-900">{trends.new_listings || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Added this period</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">New Broadcasts</p>
                  <p className="text-3xl font-bold text-gray-900">{trends.new_broadcasts || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Created this period</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Total Views</p>
                  <p className="text-3xl font-bold text-gray-900">{trends.current_total_views || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Current total</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Summary */}
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity (30 days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{stats.recent_listings_30d || 0} New Listings</h4>
                  <p className="text-sm text-gray-600">Added in the last month</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{stats.pending_requests || 0} Pending Requests</h4>
                  <p className="text-sm text-gray-600">Waiting for your response</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
