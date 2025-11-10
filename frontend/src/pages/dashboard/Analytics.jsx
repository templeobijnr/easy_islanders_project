import React from 'react';
import { TrendingUp, Eye, ShoppingBag, MessageCircle, Star, Award, Calendar, Target } from 'lucide-react';
import { useSellerAnalytics } from '../../hooks/useSellerDashboard';

const Analytics = () => {
  const { analytics, loading, error, refetch } = useSellerAnalytics();

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Analytics</h1>
        <p className="text-slate-600 mb-8">Track your business performance</p>
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600">Loading analytics...</p>
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
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              AI-Powered Insights
            </h3>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <p key={index} className="text-gray-700">
                  {insight}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_views || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Across all listings</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Listings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_listings || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600 font-medium">
                {stats.active_listings || 0} active
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_requests || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Waiting for response</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avg_rating?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Out of 5.0</span>
            </div>
          </div>
        </div>

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

        {/* Category Breakdown */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Category Distribution</h3>
              <p className="text-sm text-gray-600 mt-1">Listings by category</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => {
                    const total = Object.values(categoryBreakdown).reduce((sum, c) => sum + c, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-gray-800">{category}</span>
                          <span className="text-gray-600">{count} listings ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-lime-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
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
