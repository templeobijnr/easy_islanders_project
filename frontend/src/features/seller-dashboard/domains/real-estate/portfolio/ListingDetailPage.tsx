/**
 * ListingDetailPage - Full Management Suite for a Single Listing
 *
 * Comprehensive view showing all activity, metrics, and management tools
 * for a specific listing in one place.
 *
 * Route: /dashboard/home/real-estate/portfolio/listing/:id
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MoreVertical, Eye, Share2, BarChart3 } from 'lucide-react';

// Tab definitions
type TabValue = 'overview' | 'messages' | 'requests' | 'bookings' | 'calendar' | 'pricing' | 'analytics' | 'activity';

interface Tab {
  value: TabValue;
  label: string;
  icon?: React.ReactNode;
}

const TABS: Tab[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'messages', label: 'Messages' },
  { value: 'requests', label: 'Requests' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'activity', label: 'Activity' },
];

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Mock data - replace with actual API call
  const listing = {
    id,
    title: 'Kyrenia Beach Villa',
    reference_code: 'KYR-001',
    type: 'DAILY_RENTAL',
    status: 'active',
    base_price: 120,
    currency: 'EUR',
    image_url: undefined,
    city: 'Kyrenia',
    bedrooms: 3,
    bathrooms: 2,
    description: 'Beautiful beachfront villa with stunning sea views...',
  };

  const handleBack = () => {
    navigate('/dashboard/home/real-estate/portfolio');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button & actions */}
          <div className="py-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Portfolio</span>
            </button>

            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Report
              </button>
              <button className="px-4 py-2 bg-lime-600 text-white text-sm font-medium rounded-lg hover:bg-lime-700 transition-colors flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Listing
              </button>
              <button className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Listing header */}
          <div className="pb-4">
            <div className="flex items-start gap-6">
              {/* Image */}
              <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0 flex items-center justify-center">
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-slate-500 text-sm">No Image</span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
                    <p className="text-sm text-slate-500 mt-1">
                      {listing.reference_code} • {listing.city} • {listing.bedrooms} bed, {listing.bathrooms} bath
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        Active
                      </span>
                      <span className="text-2xl font-bold text-lime-600">
                        €{listing.base_price}
                        <span className="text-sm font-normal text-slate-600">/night</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick metrics */}
                <div className="mt-4 grid grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">New Messages</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">3</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">Pending Requests</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">2</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">Bookings (30d)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">12</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">78%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                  ${
                    activeTab === tab.value
                      ? 'border-lime-600 text-lime-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Description</h2>
              <p className="text-slate-700">{listing.description}</p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['WiFi', 'Pool', 'Sea View', 'Kitchen', 'Air Conditioning', 'Parking'].map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-lime-600">✓</span>
                    {amenity}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-video bg-slate-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Messages</h2>
            <p className="text-sm text-slate-600">Messages component will be integrated here</p>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Booking Requests</h2>
            <p className="text-sm text-slate-600">Requests component will be integrated here</p>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Confirmed Bookings</h2>
            <p className="text-sm text-slate-600">Bookings list will be integrated here</p>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Availability Calendar</h2>
            <p className="text-sm text-slate-600">Calendar component will be integrated here</p>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing Management</h2>
            <p className="text-sm text-slate-600">Pricing tools will be integrated here</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance Analytics</h2>
            <p className="text-sm text-slate-600">Analytics charts will be integrated here</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity Timeline</h2>
            <p className="text-sm text-slate-600">Activity feed will be integrated here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingDetailPage;
