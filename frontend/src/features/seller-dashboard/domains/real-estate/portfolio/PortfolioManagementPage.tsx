/**
 * PortfolioManagementPage - Simplified portfolio management interface
 *
 * Organizes listings by type (Daily Rental, Long-term, Sale, Projects)
 * with practical actions and communication tools.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ListingTypeCode } from './types';
import { TypeSummary } from './components/TypeSummary';
import { usePortfolioStats, useListingSummaries, useListingCardFirstImage } from './hooks/useRealEstateData';
import { Loader2, Plus, MapPin, Grid, List, TrendingUp, Target, Calendar, DollarSign, Rocket, Star, Zap } from 'lucide-react';
import MessagesSlideOver from './components/MessagesSlideOver';
import RealEstatePropertyUploadEnhanced from '../overview/RealEstatePropertyUploadEnhanced';
import PropertyLocationMap from '../../../../../components/ui/PropertyLocationMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const queryClient = useQueryClient();

  // Tab & filter state
  const [activeTab, setActiveTab] = useState<TabValue>('daily-rental');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedListing, setSelectedListing] = useState<string | null>(null);

  // Slide-over & modal state
  const [selectedListingForMessages, setSelectedListingForMessages] = useState<string | null>(null);
  const [selectedListingForRequests, setSelectedListingForRequests] = useState<string | null>(null);
  const [selectedListingForBookings, setSelectedListingForBookings] = useState<string | null>(null);
  const [selectedListingForCalendar, setSelectedListingForCalendar] = useState<string | null>(null);

  // Create listing modal state
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);

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

  const listingResults = listingsData?.results ?? [];

  const totalMessages = useMemo(() => listingResults.reduce((sum, l) => sum + (l.new_messages_count || 0), 0), [listingResults]);
  const totalBookings30d = useMemo(() => listingResults.reduce((sum, l) => sum + (l.bookings_30d_count || 0), 0), [listingResults]);
  const activeCount = portfolioStats?.active_count || 0;
  const totalCount = portfolioStats?.total_count || 0;
  const filteredCount = listingResults.length;

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

  // Handle successful listing creation
  const handleListingCreated = () => {
    // Invalidate all portfolio queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['portfolio', 'stats'] });
    queryClient.invalidateQueries({ queryKey: ['listings', 'summaries'] });
    setShowCreateListingModal(false);
  };

  // Message handling functions
  const [messagesStore, setMessagesStore] = useState<Record<string, { id: string; sender: 'business' | 'customer'; text: string; ts: string }[]>>({});

  const threads = useMemo(() => {
    const base = listingResults.slice(0, 12).map(l => ({
      id: String(l.listing_id),
      listingTitle: l.title,
      customerName: 'Customer',
      unread: l.new_messages_count || 0,
      lastMessagePreview: 'Tap to open conversation',
    }))
    if (base.length === 0) return [{ id: 'demo-1', listingTitle: 'Sample Listing', customerName: 'Demo Customer', unread: 1, lastMessagePreview: 'Hello, is this available?' }]
    return base
  }, [listingResults])

  const ensureMessages = (id: string) => {
    if (!messagesStore[id]) {
      setMessagesStore(prev => ({
        ...prev,
        [id]: [
          { id: 'm1', sender: 'customer', text: 'Hello, is this available?', ts: new Date().toISOString() },
        ],
      }))
    }
  }

  const openInbox = (id: string | 'all') => {
    setSelectedListingForMessages(id === 'all' ? 'all' : String(id))
    const firstId = id === 'all' ? (threads[0]?.id ?? 'demo-1') : String(id)
    ensureMessages(firstId)
  }

  const handleSendMessage = (threadId: string, text: string) => {
    setMessagesStore(prev => {
      const next = [...(prev[threadId] ?? [])]
      next.push({ id: Math.random().toString(36).slice(2), sender: 'business', text, ts: new Date().toISOString() })
      return { ...prev, [threadId]: next }
    })
  }

  const ListingCardImage: React.FC<{ listingId: number | string; title: string; fallbackUrl?: string | null }> = ({ listingId, title, fallbackUrl }) => {
    const { data: first } = useListingCardFirstImage(listingId);
    const src = first || fallbackUrl || null;
    if (src) {
      return <img src={src} alt={title} className="w-full h-full object-cover" />;
    }
    return (
      <>
        <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40" />
        <span className="text-[hsl(var(--sand-700))] text-sm font-medium z-10">No image</span>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - match portfolio stats card theme */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-ocean-500 to-ocean-600 border border-slate-200 sticky top-6 z-10 shadow-lg">
          {/* Decorative circle like in sidebar */}
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white bg-opacity-40" />
          
          <div className="relative z-10 px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Real Estate
                  {currentListingType && (
                    <span className="text-white/80 font-normal"> / {TABS.find(tab => tab.value === activeTab)?.label}</span>
                  )}
                </h1>
                <p className="text-sm text-white/90 mt-1">{filteredCount} {filteredCount === 1 ? 'listing' : 'listings'} found</p>
              </div>

              {/* Create Listing Button - match stats card button shape */}
              <button
                onClick={() => setShowCreateListingModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-blue-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Listing</span>
              </button>
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
                        ? 'border-white text-white'
                        : 'border-transparent text-white/70 hover:text-white hover:border-white/50'
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm">Portfolio</div>
              </div>
              <div className="mt-3 flex items-end gap-4">
                <div>
                  <div className="text-3xl font-bold">{activeCount}</div>
                  <div className="text-xs opacity-90">Active</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{totalCount}</div>
                  <div className="text-xs opacity-90">Total</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button className="px-4 py-2 rounded-lg bg-white text-blue-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all">View Portfolio</button>
                <button onClick={() => setShowCreateListingModal(true)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white text-blue-700 text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                  <Plus className="h-4 w-4" />
                  Create
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Calendar</div>
                <div className="text-xs text-slate-500">30d</div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-lime-600">{totalBookings30d}</div>
                <div className="text-xs text-slate-600">Bookings (30d)</div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button onClick={() => setSelectedListingForCalendar('all')} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-sm">Open Calendar</button>
                <div className="text-xs text-slate-500">Upcoming activities</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Messages</div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-lime-600">{totalMessages}</div>
                <div className="text-xs text-slate-600">New messages</div>
              </div>
              <div className="mt-4">
                <button onClick={() => openInbox('all')} className="px-3 py-2 rounded-lg bg-[hsl(var(--sand-100))] hover:bg-[hsl(var(--ocean-50))] border border-[hsl(var(--sand-200))] transition-colors text-sm">Open Inbox</button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Campaigns & Marketing Section */}
        <div className="mb-6">
          <CampaignsSection />
        </div>
        
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
                <div className="flex flex-col md:flex-row gap-4 items-center">
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

                  {/* Dynamic Listing Count */}
                  <div className="text-slate-600 font-medium">
                    {filteredCount} {filteredCount === 1 ? 'listing' : 'listings'} found
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

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'grid'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'map'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Listing Grid/Map - Real data with loading and error states */}
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
            ) : listingResults.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listingResults.map((listing) => (
                    <div
                      key={listing.listing_id}
                      onClick={() => handleCardClick(listing.listing_id)}
                      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer relative"
                    >
                      <div className="aspect-video flex items-center justify-center relative overflow-hidden bg-[hsl(var(--sand-100))]">
                        <ListingCardImage listingId={listing.listing_id} title={listing.title} fallbackUrl={listing.image_url} />
                      </div>

                      {/* Card content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 group-hover:text-lime-600 transition-colors line-clamp-2">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {listing.location_city}
                          {listing.location_area && `, ${listing.location_area}`}
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
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                                listing.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  listing.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-600'
                                }`}
                              />
                              {listing.status}
                            </span>
                          </div>
                          {listing.new_messages_count > 0 && (
                            <div className="flex items-center gap-2 text-slate-700">
                              <span className="text-lg">💬</span>
                              <span>
                                {listing.new_messages_count} new message
                                {listing.new_messages_count !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                          {listing.pending_requests_count > 0 && (
                            <div className="flex items-center gap-2 text-slate-700">
                              <span className="text-lg">📩</span>
                              <span>
                                {listing.pending_requests_count} request
                                {listing.pending_requests_count !== 1 ? 's' : ''}
                              </span>
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
                /* Map View */
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Property Locations</h3>
                    <div className="text-sm text-slate-600">{listingResults.length} properties</div>
                  </div>
                  
                  {/* Map Container */}
                  <div className="h-[500px] rounded-xl overflow-hidden border border-slate-200">
                    <PropertyLocationMap
                      city={listingResults[0]?.location_city}
                      area={listingResults[0]?.location_area}
                      height="100%"
                      className="w-full"
                    />
                  </div>

                  {/* Property List Sidebar */}
                  <div className="mt-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {listingResults.map((listing) => (
                        <div
                          key={listing.listing_id}
                          onClick={() => handleCardClick(listing.listing_id)}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
                        >
                          <h4 className="font-medium text-slate-900 text-sm truncate">
                            {listing.title}
                          </h4>
                          <p className="text-xs text-slate-600">{listing.location_city}</p>
                          <p className="text-sm font-semibold text-brand-600 mt-1">
                            {listing.currency} {listing.base_price}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
            ) : (
              // Empty State
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-900 font-medium text-lg">No listings found</p>
                <p className="text-slate-600 text-sm mt-2">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : `No ${TABS.find(tab => tab.value === activeTab)?.label?.toLowerCase() || 'real estate'} listings found. Create your first listing to get started`}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Slide-over Panels - Will be implemented */}
      {selectedListingForMessages && (
        <MessagesSlideOver
          listingId={selectedListingForMessages === 'all' ? 'all' : String(selectedListingForMessages)}
          threads={threads}
          messagesByThread={messagesStore}
          onSendMessage={handleSendMessage}
          onClose={() => setSelectedListingForMessages(null)}
        />
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

      {/* Create Listing Modal */}
      <RealEstatePropertyUploadEnhanced
        open={showCreateListingModal}
        onOpenChange={setShowCreateListingModal}
        onSuccess={handleListingCreated}
      />
    </div>
  );
}

// Campaigns Section Component
const CampaignsSection: React.FC = () => {
  const [activeCampaignTab, setActiveCampaignTab] = useState<'active' | 'scheduled' | 'completed'>('active');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  // Mock campaign data
  const campaigns = {
    active: [
      {
        id: 1,
        name: 'Summer Boost Campaign',
        type: 'Featured Listing',
        status: 'active',
        budget: 500,
        spent: 320,
        impressions: 12500,
        clicks: 450,
        conversions: 12,
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        listings: 5
      },
      {
        id: 2,
        name: 'Weekend Special',
        type: 'Discount Promotion',
        status: 'active',
        budget: 200,
        spent: 150,
        impressions: 8200,
        clicks: 280,
        conversions: 8,
        startDate: '2024-06-15',
        endDate: '2024-07-15',
        listings: 3
      }
    ],
    scheduled: [
      {
        id: 3,
        name: 'Holiday Season Push',
        type: 'Featured Listing',
        status: 'scheduled',
        budget: 1000,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        listings: 8
      }
    ],
    completed: [
      {
        id: 4,
        name: 'Spring Launch',
        type: 'Boost Campaign',
        status: 'completed',
        budget: 750,
        spent: 750,
        impressions: 18500,
        clicks: 620,
        conversions: 18,
        startDate: '2024-03-01',
        endDate: '2024-05-31',
        listings: 6
      }
    ]
  };

  const currentCampaigns = campaigns[activeCampaignTab] || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-600" />
              Marketing Campaigns
            </h2>
            <p className="text-sm text-slate-600 mt-1">Plan campaigns, discounts, and featured slots to drive more demand</p>
          </div>
          <Button 
            onClick={() => setShowCreateCampaign(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Campaign Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(['active', 'scheduled', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCampaignTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeCampaignTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <Badge variant="secondary" className="ml-2">
                {campaigns[tab].length}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Campaign List */}
      <div className="p-6">
        {currentCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No {activeCampaignTab} campaigns</h3>
            <p className="text-sm text-slate-600 mb-4">
              {activeCampaignTab === 'active' && 'Create your first campaign to boost your listings'}
              {activeCampaignTab === 'scheduled' && 'Schedule campaigns to launch at the perfect time'}
              {activeCampaignTab === 'completed' && 'Your completed campaigns will appear here'}
            </p>
            <Button 
              onClick={() => setShowCreateCampaign(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {currentCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-6 border-t border-slate-200 bg-slate-50">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <QuickActionButton
            icon={<Star className="h-4 w-4" />}
            title="Feature Listing"
            description="Get premium placement"
            onClick={() => setShowCreateCampaign(true)}
          />
          <QuickActionButton
            icon={<Zap className="h-4 w-4" />}
            title="Boost Visibility"
            description="Increase search ranking"
            onClick={() => setShowCreateCampaign(true)}
          />
          <QuickActionButton
            icon={<DollarSign className="h-4 w-4" />}
            title="Create Discount"
            description="Attract more bookings"
            onClick={() => setShowCreateCampaign(true)}
          />
        </div>
      </div>
    </div>
  );
};

// Campaign Card Component
const CampaignCard: React.FC<{ campaign: any }> = ({ campaign }) => {
  const performanceScore = campaign.conversions > 0 ? Math.min(100, (campaign.conversions / campaign.clicks) * 100 * 10) : 0;
  const budgetUsed = (campaign.spent / campaign.budget) * 100;

  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900">{campaign.name}</h4>
            <Badge 
              variant={campaign.status === 'active' ? 'default' : campaign.status === 'scheduled' ? 'secondary' : 'outline'}
              className={campaign.status === 'active' ? 'bg-green-100 text-green-800' : campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}
            >
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">{campaign.type} • {campaign.listings} listings</p>
          <p className="text-xs text-slate-500 mt-1">
            {campaign.startDate} to {campaign.endDate}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">${campaign.spent}</p>
          <p className="text-xs text-slate-500">of ${campaign.budget}</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{campaign.impressions?.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Impressions</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{campaign.clicks}</p>
          <p className="text-xs text-slate-500">Clicks</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{campaign.conversions}</p>
          <p className="text-xs text-slate-500">Conversions</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{performanceScore.toFixed(1)}%</p>
          <p className="text-xs text-slate-500">Score</p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
          <span>Budget Usage</span>
          <span>{budgetUsed.toFixed(0)}%</span>
        </div>
        <Progress value={budgetUsed} className="h-2" />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          View Details
        </Button>
        {campaign.status === 'active' && (
          <Button variant="outline" size="sm" className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50">
            Pause Campaign
          </Button>
        )}
        {campaign.status === 'scheduled' && (
          <Button variant="outline" size="sm" className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50">
            Edit Campaign
          </Button>
        )}
      </div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
  >
    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-medium text-slate-900 text-sm">{title}</p>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  </button>
);

export default PortfolioManagementPage;
