import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import EditListingModal from '../../components/modals/EditListingModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import PublishActionModal from '../../components/modals/PublishActionModal';
import ListingActionMenu from '../../components/listings/ListingActionMenu';
import axios from 'axios';
import config from '../../config';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, published, draft
  const [sortBy, setSortBy] = useState('newest');
  
  // Modal states
  const [editingListing, setEditingListing] = useState(null);
  const [deletingListing, setDeletingListing] = useState(null);
  const [publishingListing, setPublishingListing] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${config.API_BASE_URL}/api/listings/my/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setListings(response.data.listings || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter listings
  const filteredListings = listings.filter((listing) => {
    if (filter === 'published') return listing.status === 'published';
    if (filter === 'draft') return listing.status === 'draft';
    return true;
  });

  // Sort listings
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  // Calculate stats
  const stats = {
    total: listings.length,
    published: listings.filter((l) => l.status === 'published').length,
    draft: listings.filter((l) => l.status === 'draft').length,
  };

  // Modal handlers
  const handleEditSave = (updatedListing) => {
    setListings((prev) =>
      prev.map((l) => (l.id === updatedListing.id ? updatedListing : l))
    );
    showToast('Listing updated successfully!');
  };

  const handleDeleteConfirm = (listingId) => {
    setListings((prev) => prev.filter((l) => l.id !== listingId));
    showToast('Listing deleted successfully!');
  };

  const handlePublishConfirm = (updatedListing) => {
    setListings((prev) =>
      prev.map((l) => (l.id === updatedListing.id ? updatedListing : l))
    );
    const action = updatedListing.status === 'published' ? 'published' : 'unpublished';
    showToast(`Listing ${action} successfully!`);
  };

  const handleDuplicate = async (listing) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.API_BASE_URL}/api/listings/${listing.id}/duplicate/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchListings();
      showToast('Listing duplicated successfully!');
    } catch (err) {
      console.error('Error duplicating listing:', err);
      showToast('Failed to duplicate listing');
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const createListingButton = (
    <Link
      to="/create-listing"
      className="
        flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg
        hover:bg-brand-dark transition-all duration-200 font-semibold text-sm
      "
    >
      <Plus className="w-5 h-5" />
      <span>Create New</span>
    </Link>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <DashboardHeader
        title="My Listings"
        subtitle={`You have ${stats.total} listings`}
        action={createListingButton}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="m-6 mb-0 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <p className="text-green-700 font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 text-sm font-medium">Total Listings</p>
            <p className="text-4xl font-bold text-gray-800 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 text-sm font-medium">Published</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{stats.published}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 text-sm font-medium">Drafts</p>
            <p className="text-4xl font-bold text-gray-400 mt-2">{stats.draft}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="
                  px-3 py-2 border border-gray-300 rounded-lg
                  text-gray-700 bg-white hover:border-gray-400
                  focus:outline-none focus:ring-2 focus:ring-brand
                "
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="
                  px-3 py-2 border border-gray-300 rounded-lg
                  text-gray-700 bg-white hover:border-gray-400
                  focus:outline-none focus:ring-2 focus:ring-brand
                "
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading listings...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchListings}
              className="ml-auto text-red-700 hover:text-red-800 font-semibold text-sm underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedListings.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg">No listings yet</p>
            <p className="text-gray-500 mt-2">Create your first listing to get started</p>
            <Link
              to="/create-listing"
              className="
                inline-flex items-center gap-2 mt-6 px-6 py-3 bg-brand text-white
                rounded-lg hover:bg-brand-dark transition-all duration-200 font-semibold
              "
            >
              <Plus className="w-5 h-5" />
              Create Listing
            </Link>
          </div>
        )}

        {/* Listings Table */}
        {!loading && sortedListings.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedListings.map((listing) => (
                  <tr key={listing.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {listing.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {listing.category?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                      €{listing.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${
                            listing.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }
                        `}
                      >
                        {listing.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ListingActionMenu
                        listing={listing}
                        onEdit={() => setEditingListing(listing)}
                        onDelete={() => setDeletingListing(listing)}
                        onPublish={() => setPublishingListing(listing)}
                        onDuplicate={() => handleDuplicate(listing)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <EditListingModal
        listing={editingListing}
        isOpen={!!editingListing}
        onClose={() => setEditingListing(null)}
        onSave={handleEditSave}
      />
      <DeleteConfirmModal
        listing={deletingListing}
        isOpen={!!deletingListing}
        onClose={() => setDeletingListing(null)}
        onDelete={handleDeleteConfirm}
      />
      <PublishActionModal
        listing={publishingListing}
        isOpen={!!publishingListing}
        onClose={() => setPublishingListing(null)}
        onPublish={handlePublishConfirm}
      />
    </div>
  );
};

export default MyListings;
