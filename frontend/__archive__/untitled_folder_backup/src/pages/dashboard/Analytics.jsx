import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, TrendingUp, Eye, Heart, MessageCircle, Users, DollarSign } from 'lucide-react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
// import { useAuth } from '../../contexts/AuthContext'; // Unused
import axios from 'axios';
import config from '../../config';

// Valid ranges used by the UI. Adjust if you support other ranges.
const DEFAULT_RANGE = '30d';

const Analytics = () => {
  // const [analytics, setAnalytics] = useState(null); // Placeholder for when API is connected
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(DEFAULT_RANGE);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${config.API_BASE_URL}/api/analytics/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: { time_range: timeRange }
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // useEffect(() => {
  //   fetchAnalytics();
  // }, [fetchAnalytics]);

  // Mock data for now - replace with real data when API is connected
  const stats = {
    total_views: 0,
    total_likes: 0,
    total_messages: 0,
    total_revenue: 0,
    views_growth: 0,
    likes_growth: 0,
    messages_growth: 0,
    revenue_growth: 0
  };
  const listings = [];

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Analytics" subtitle="Track your listing performance" />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

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
              <span className="text-sm text-green-600 font-medium">+{stats.views_growth || 0}%</span>
              <span className="text-sm text-gray-500 ml-1">vs previous period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Likes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_likes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600 font-medium">+{stats.likes_growth || 0}%</span>
              <span className="text-sm text-gray-500 ml-1">vs previous period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_messages || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600 font-medium">+{stats.messages_growth || 0}%</span>
              <span className="text-sm text-gray-500 ml-1">vs previous period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">€{stats.total_revenue || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600 font-medium">+{stats.revenue_growth || 0}%</span>
              <span className="text-sm text-gray-500 ml-1">vs previous period</span>
            </div>
          </div>
        </div>

        {/* Top Performing Listings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Top Performing Listings</h3>
            <p className="text-sm text-gray-600 mt-1">Your best performing listings this period</p>
          </div>
          <div className="p-6">
            {listings.length > 0 ? (
              <div className="space-y-4">
                {listings.slice(0, 5).map((listing, index) => (
                  <div key={listing.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{listing.title}</h4>
                        <p className="text-sm text-gray-600">{listing.category?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-gray-800">{listing.views || 0}</p>
                        <p className="text-gray-600">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-800">{listing.likes || 0}</p>
                        <p className="text-gray-600">Likes</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-800">{listing.messages || 0}</p>
                        <p className="text-gray-600">Messages</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">No Data Available</h4>
                <p className="text-gray-600">Start creating listings to see your analytics here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-brand transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">View All Listings</h4>
                  <p className="text-sm text-gray-600">Manage your listings</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-brand transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Create New Listing</h4>
                  <p className="text-sm text-gray-600">Add more listings</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-brand transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">View Messages</h4>
                  <p className="text-sm text-gray-600">Check customer inquiries</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
