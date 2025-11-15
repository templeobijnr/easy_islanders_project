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
import { ArrowLeft, Edit, Trash2, MoreVertical, Eye, Share2, BarChart3, Loader2 } from 'lucide-react';
import { useListing } from './hooks/useRealEstateData';

// Tab components
import { OverviewTab } from './ListingDetailPage/OverviewTab';
import { MessagesTab } from './ListingDetailPage/MessagesTab';
import { RequestsTab } from './ListingDetailPage/RequestsTab';
import { BookingsTab } from './ListingDetailPage/BookingsTab';
import { CalendarTab } from './ListingDetailPage/CalendarTab';
import { PricingTab } from './ListingDetailPage/PricingTab';
import { AnalyticsTab } from './ListingDetailPage/AnalyticsTab';
import { ActivityTab } from './ListingDetailPage/ActivityTab';
import { EditListingModal } from './components/EditListingModal';

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
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch listing data with React Query
  const {
    data: listing,
    isLoading,
    error,
  } = useListing(id);

  const handleBack = () => {
    navigate('/dashboard/home/real-estate/portfolio');
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lime-600 mx-auto" />
          <p className="mt-4 text-slate-700 font-medium">Loading listing details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl border border-red-200 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Failed to Load Listing</h2>
          <p className="text-slate-600 mb-6">
            {error instanceof Error ? error.message : 'An error occurred while loading the listing.'}
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Back to Portfolio
          </button>
        </div>
      </div>
    );
  }

  // No listing found
  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-lg">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏠</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Listing Not Found</h2>
          <p className="text-slate-600 mb-6">
            The listing you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Back to Portfolio
          </button>
        </div>
      </div>
    );
  }

  // Extract property data
  const property = listing.property;
  const location = property?.location;
  const firstImage = listing.image_urls && listing.image_urls.length > 0 ? listing.image_urls[0] : null;

  // Get status badge info
  const getStatusBadge = () => {
    switch (listing.status) {
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          dot: 'bg-emerald-600',
          label: 'Active'
        };
      case 'DRAFT':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-600',
          label: 'Draft'
        };
      case 'INACTIVE':
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-200',
          dot: 'bg-slate-600',
          label: 'Inactive'
        };
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-200',
          dot: 'bg-slate-600',
          label: listing.status
        };
    }
  };

  const statusBadge = getStatusBadge();

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
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
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
              <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-lime-200 via-emerald-200 to-sky-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {firstImage ? (
                  <img src={firstImage} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-700 text-sm font-medium">No Image</span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
                    <p className="text-sm text-slate-500 mt-1">
                      {listing.reference_code}
                      {location && ` • ${location.city}`}
                      {property && ` • ${property.bedrooms} bed, ${property.bathrooms} bath`}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                        <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                        {statusBadge.label}
                      </span>
                      <span className="text-2xl font-bold text-lime-600">
                        {listing.currency}{listing.base_price}
                        <span className="text-sm font-normal text-slate-600">
                          {listing.price_period === 'PER_DAY' && '/night'}
                          {listing.price_period === 'PER_MONTH' && '/month'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick metrics - TODO: Wire with real API data */}
                <div className="mt-4 grid grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">New Messages</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">-</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">Pending Requests</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">-</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">Bookings (30d)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">-</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">-</p>
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
        {activeTab === 'overview' && <OverviewTab listing={listing} />}
        {activeTab === 'messages' && <MessagesTab listingId={id || ''} />}
        {activeTab === 'requests' && <RequestsTab listingId={id || ''} />}
        {activeTab === 'bookings' && <BookingsTab listingId={id || ''} />}
        {activeTab === 'calendar' && <CalendarTab listingId={id || ''} basePrice={listing.base_price} currency={listing.currency} />}
        {activeTab === 'pricing' && <PricingTab listingId={id || ''} basePrice={listing.base_price} currency={listing.currency} />}
        {activeTab === 'analytics' && <AnalyticsTab listingId={id || ''} />}
        {activeTab === 'activity' && <ActivityTab listingId={id || ''} />}
      </div>

      {/* Edit Listing Modal */}
      <EditListingModal
        listing={listing}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
};

export default ListingDetailPage;
