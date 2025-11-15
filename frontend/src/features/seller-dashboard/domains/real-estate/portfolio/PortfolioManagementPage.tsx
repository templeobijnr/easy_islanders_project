/**
 * PortfolioManagementPage - Simplified portfolio management interface
 *
 * Organizes listings by type (Daily Rental, Long-term, Sale, Projects)
 * with practical actions and communication tools.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListingTypeCode } from './types';
import { TypeSummary } from './components/TypeSummary';
import { usePortfolioStats, useListingSummaries } from './hooks/useRealEstateData';
import { Loader2 } from 'lucide-react';

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
  const navigate = useNavigate();

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

  // Navigate to listing detail page
  const handleCardClick = (listingId: string | number) => {
    navigate(`/dashboard/home/real-estate/portfolio/listing/${listingId}`);
  };

  // Fetch portfolio stats for current listing type
  const {
    data: portfolioStats,
    isLoading: statsLoading,
    error: statsError
  } = usePortfolioStats(currentListingType || '');

  // Prepare params for listing summaries
  const listingParams = useMemo(() => ({
    listing_type: currentListingType,
    status: statusFilter === 'all' ? undefined : statusFilter.toUpperCase(),
    search: searchQuery || undefined,
    sort: sortBy,
    page: 1,
    limit: 20,
  }), [currentListingType, statusFilter, searchQuery, sortBy]);

  // Fetch listing summaries
  const {
    data: listingsData,
    isLoading: listingsLoading,
    error: listingsError,
  } = useListingSummaries(listingParams);

  // Convert portfolio stats to TypeSummary format
  const getTypeSummaryData = (stats: typeof portfolioStats) => {
    if (!stats) return { active: 0, total: 0 };

    return {
      active: stats.active_count || 0,
      total: stats.total_count || 0,
      booked_this_month: stats.booked_this_month,
      pending_requests: stats.pending_requests,
      rented: stats.rented_count,
      pending_applications: stats.pending_applications,
      under_offer: stats.under_offer_count,
      viewing_requests: stats.viewing_requests_count,
      offers_received: stats.offers_received_count,
      total_units: stats.total_units,
      available_units: stats.available_units,
      enquiries: stats.enquiries_count,
    };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Matching seller-dashboard card style with rounded edges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200 border border-slate-200 sticky top-6 z-10 shadow-lg">
          {/* Decorative circle like in sidebar */}
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40" />
          
          <div className="relative z-10 px-6 py-4">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-slate-900">Portfolio Management</h1>
              <p className="text-sm text-slate-700 mt-1">Manage your listings by type</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto">
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'activity' ? (
          // Activity Tab
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            <p className="text-sm text-slate-600">Activity feed showing all recent events across your listings.</p>
            {/* ActivityTab component will be implemented later */}
          </div>
        ) : (
          <>
            {/* Type Summary */}
            {currentListingType && (
              <div className="mb-6">
                <TypeSummary
                  type={currentListingType}
                  data={getTypeSummaryData(portfolioStats)}
                  isLoading={statsLoading}
                />
              </div>
            )}

            {/* Search & Filter Bar */}
            <div className="mb-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-lg">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="🔍 Search listings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
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
                    className="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="bookings">Most Bookings</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Listing Grid - Real data with loading and error states */}
            {listingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-lime-600" />
                <span className="ml-3 text-slate-600">Loading listings...</span>
              </div>
            ) : listingsError ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <p className="text-red-800 font-medium">Failed to load listings</p>
                <p className="text-red-600 text-sm mt-1">Please try again later</p>
              </div>
            ) : listingsData?.results && listingsData.results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listingsData.results.map((listing) => (
                  <div
                    key={listing.listing_id}
                    onClick={() => handleCardClick(listing.listing_id)}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer relative"
                  >
                    {/* Image */}
                    <div className="aspect-video bg-gradient-to-br from-lime-200 via-emerald-200 to-sky-200 flex items-center justify-center relative overflow-hidden">
                      {listing.image_url ? (
                        <img
                          src={listing.image_url}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          {/* Decorative circle */}
                          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40" />
                          <span className="text-slate-700 text-sm font-medium z-10">No image</span>
                        </>
                      )}
                    </div>

                    {/* Card content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 group-hover:text-lime-600 transition-colors line-clamp-2">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {listing.location_city}{listing.location_area && `, ${listing.location_area}`}
                      </p>
                      <p className="text-lg font-bold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent mt-2">
                        {listing.currency} {listing.base_price}
                      </p>

                      {/* Property details */}
                      {(listing.bedrooms > 0 || listing.bathrooms > 0) && (
                        <p className="text-sm text-slate-600 mt-2">
                          {listing.bedrooms > 0 && `${listing.bedrooms} bed`}
                          {listing.bedrooms > 0 && listing.bathrooms > 0 && ' • '}
                          {listing.bathrooms > 0 && `${listing.bathrooms} bath`}
                        </p>
                      )}

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                            listing.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              listing.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-600'
                            }`} />
                            {listing.status}
                          </span>
                        </div>
                        {listing.new_messages_count > 0 && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="text-lg">💬</span>
                            <span>{listing.new_messages_count} new message{listing.new_messages_count !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {listing.pending_requests_count > 0 && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="text-lg">📩</span>
                            <span>{listing.pending_requests_count} request{listing.pending_requests_count !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {listing.bookings_30d_count > 0 && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="text-lg">📊</span>
                            <span>{listing.bookings_30d_count} bookings (30d)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty State
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-900 font-medium text-lg">No listings found</p>
                <p className="text-slate-600 text-sm mt-2">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Create your first listing to get started'}
                </p>
              </div>
            )}
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
