/**
 * PortfolioManagementPage - Simplified portfolio management interface
 *
 * Organizes listings by type (Daily Rental, Long-term, Sale, Projects)
 * with practical actions and communication tools.
 */

import React, { useState } from 'react';
import { ListingTypeCode } from './types';

// Tab definitions
type TabValue = 'daily-rental' | 'long-term' | 'sale' | 'projects' | 'activity';

interface Tab {
  value: TabValue;
  label: string;
  listingType?: ListingTypeCode;
}

const TABS: Tab[] = [
  { value: 'daily-rental', label: 'Daily Rental', listingType: 'DAILY_RENTAL' },
  { value: 'long-term', label: 'Long-term Rent', listingType: 'LONG_TERM_RENTAL' },
  { value: 'sale', label: 'Sale', listingType: 'SALE' },
  { value: 'projects', label: 'Projects', listingType: 'PROJECT' },
  { value: 'activity', label: 'Activity' },
];

type SortOption = 'recent' | 'price-high' | 'price-low' | 'bookings';
type StatusFilter = 'all' | 'active' | 'inactive' | 'draft';

export const PortfolioManagementPage: React.FC = () => {
  // Tab & filter state
  const [activeTab, setActiveTab] = useState<TabValue>('daily-rental');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Slide-over & modal state
  const [selectedListingForMessages, setSelectedListingForMessages] = useState<string | null>(null);
  const [selectedListingForRequests, setSelectedListingForRequests] = useState<string | null>(null);
  const [selectedListingForBookings, setSelectedListingForBookings] = useState<string | null>(null);
  const [selectedListingForCalendar, setSelectedListingForCalendar] = useState<string | null>(null);

  // Get current listing type from active tab
  const currentListingType = TABS.find(tab => tab.value === activeTab)?.listingType;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-slate-900">Portfolio Management</h1>
            <p className="text-sm text-slate-600 mt-1">Manage your listings by type</p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'activity' ? (
          // Activity Tab
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            <p className="text-sm text-slate-600">Activity feed showing all recent events across your listings.</p>
            {/* ActivityTab component will be implemented later */}
          </div>
        ) : (
          <>
            {/* Type Summary - Will be implemented */}
            <div className="mb-6">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-sm text-slate-600">
                  Type summary for {currentListingType} - TypeSummary component will display metrics here
                </p>
              </div>
            </div>

            {/* Search & Filter Bar - Will be implemented */}
            <div className="mb-6">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="🔍 Search listings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="bookings">Most Bookings</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Listing Grid - Will display listing cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Placeholder cards - will be replaced with actual listing cards */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <span className="text-slate-500 text-sm">Listing Card {i}</span>
                  </div>

                  {/* Card content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900">Listing Title</h3>
                    <p className="text-lg font-bold text-lime-600 mt-1">€120/night</p>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span>● Active</span>
                      </div>
                      <button
                        onClick={() => setSelectedListingForMessages(`listing-${i}`)}
                        className="w-full text-left hover:text-lime-600 transition-colors"
                      >
                        💬 3 new messages
                      </button>
                      <button
                        onClick={() => setSelectedListingForRequests(`listing-${i}`)}
                        className="w-full text-left hover:text-lime-600 transition-colors"
                      >
                        📩 2 booking requests
                      </button>
                      <button
                        onClick={() => setSelectedListingForBookings(`listing-${i}`)}
                        className="w-full text-left hover:text-lime-600 transition-colors"
                      >
                        📊 12 bookings
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setSelectedListingForCalendar(`listing-${i}`)}
                        className="flex-1 px-3 py-2 bg-lime-600 text-white text-sm font-medium rounded-lg hover:bg-lime-700 transition-colors"
                      >
                        📅 Calendar
                      </button>
                      <button className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                        💰 Pricing
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State - Will show when no listings */}
            {/* <EmptyState /> */}
          </>
        )}
      </div>

      {/* Slide-over Panels - Will be implemented */}
      {selectedListingForMessages && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-xl">
            <div className="p-4 border-b border-slate-200">
              <button
                onClick={() => setSelectedListingForMessages(null)}
                className="text-slate-600 hover:text-slate-900"
              >
                ← Back
              </button>
              <h2 className="text-lg font-semibold mt-2">Messages</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600">MessagesSlideOver component will be implemented here</p>
            </div>
          </div>
        </div>
      )}

      {selectedListingForRequests && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-xl">
            <div className="p-4 border-b border-slate-200">
              <button
                onClick={() => setSelectedListingForRequests(null)}
                className="text-slate-600 hover:text-slate-900"
              >
                ← Back
              </button>
              <h2 className="text-lg font-semibold mt-2">Booking Requests</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600">RequestsSlideOver component will be implemented here</p>
            </div>
          </div>
        </div>
      )}

      {selectedListingForBookings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-xl">
            <div className="p-4 border-b border-slate-200">
              <button
                onClick={() => setSelectedListingForBookings(null)}
                className="text-slate-600 hover:text-slate-900"
              >
                ← Back
              </button>
              <h2 className="text-lg font-semibold mt-2">Bookings</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600">BookingsSlideOver component will be implemented here</p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {selectedListingForCalendar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Calendar</h2>
              <button
                onClick={() => setSelectedListingForCalendar(null)}
                className="text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600">CalendarModal component will be implemented here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioManagementPage;
