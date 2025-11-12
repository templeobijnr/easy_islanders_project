import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  AlertCircle,
  Package,
  CheckCircle2,
  Search,
  Eye,
  Edit3,
  Trash2,
  Copy,
  X,
  ImageIcon,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp
} from 'lucide-react';
import { getAllCategories } from '../../lib/categoryDesign';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import EditListingModal from '../../components/modals/EditListingModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import PublishActionModal from '../../components/modals/PublishActionModal';
import axios from 'axios';
import config from '../../config';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, published, draft
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, or category slug
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [editingListing, setEditingListing] = useState(null);
  const [deletingListing, setDeletingListing] = useState(null);
  const [publishingListing, setPublishingListing] = useState(null);
  const [previewListing, setPreviewListing] = useState(null);
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

  // Filter and search listings
  const filteredListings = listings.filter((listing) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'published' && listing.status === 'published') ||
      (filter === 'draft' && listing.status === 'draft');

    const matchesCategory =
      categoryFilter === 'all' ||
      listing.category?.slug === categoryFilter ||
      listing.category?.name?.toLowerCase().replace(/\s+/g, '-') === categoryFilter;

    const matchesSearch =
      !searchQuery ||
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesCategory && matchesSearch;
  });

  // Sort listings
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  // Calculate stats
  const stats = {
    total: listings.length,
    published: listings.filter((l) => l.status === 'published').length,
    draft: listings.filter((l) => l.status === 'draft').length,
    views: listings.reduce((sum, l) => sum + (l.views || 0), 0),
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-background/90 backdrop-blur rounded-2xl border border-border p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Listings</h1>
          <p className="text-muted-foreground">Manage your marketplace offerings</p>
        </div>
        <Link
          to="/create-listing"
          className="group flex items-center gap-2 px-6 py-3"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>Create New Listing</span>
        </Link>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center gap-3 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700 font-medium flex-1">{toastMessage}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-green-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        {/* Stats Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={item}>
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-primary/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <motion.p
                    className="text-4xl font-bold text-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    {stats.total}
                  </motion.p>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Total Listings</h3>
                <p className="text-xs text-primary">All your marketplace items</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-success/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <motion.p
                    className="text-4xl font-bold text-success"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                  >
                    {stats.published}
                  </motion.p>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Published</h3>
                <p className="text-xs text-success">Live on marketplace</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-warning/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-6 h-6 text-warning" />
                  </div>
                  <motion.p
                    className="text-4xl font-bold text-warning"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.4 }}
                  >
                    {stats.draft}
                  </motion.p>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Drafts</h3>
                <p className="text-xs text-warning">Pending completion</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-500/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6 text-purple-700" />
                  </div>
                  <motion.p
                    className="text-4xl font-bold text-purple-700"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.5 }}
                  >
                    {stats.views}
                  </motion.p>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Total Views</h3>
                <p className="text-xs text-purple-700">Across all listings</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Category Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto bg-slate-100 p-1.5 rounded-xl">
              <TabsTrigger value="all" className="flex items-center gap-2 px-4">
                <Package className="w-4 h-4" />
                <span>All Categories</span>
                <Badge variant="secondary" className="ml-1 bg-slate-200 text-slate-700">
                  {listings.length}
                </Badge>
              </TabsTrigger>

              {getAllCategories().map((category) => {
                const Icon = category.icon;
                const categoryListings = listings.filter(
                  (l) => l.category?.slug === category.slug ||
                         l.category?.name?.toLowerCase().replace(/\s+/g, '-') === category.slug
                );
                const count = categoryListings.length;

                if (count === 0) return null;

                return (
                  <TabsTrigger
                    key={category.slug}
                    value={category.slug}
                    className="flex items-center gap-2 px-4"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                    <Badge
                      variant="secondary"
                      className={`ml-1 ${category.badgeBg} ${category.badgeText}`}
                    >
                      {count}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-background border border-border rounded-2xl p-6 mb-6 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by title, category, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-input rounded-xl text-foreground bg-background hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-input rounded-xl text-foreground bg-background hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 border border-input rounded-xl text-foreground bg-background hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="title">Title: A to Z</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-24"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <Package className="w-12 h-12 text-lime-600 mb-4" />
              </motion.div>
              <p className="text-slate-600 font-medium">Loading your listings...</p>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4 mb-6 shadow-sm"
          >
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <button
              className="px-4 py-2 font-semibold text-sm transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && sortedListings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-16 text-center shadow-inner"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              <Package className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              {searchQuery || filter !== 'all' ? 'No matching listings' : 'No listings yet'}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Create your first listing to start selling on the marketplace'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Link
                to="/create-listing"
                className="inline-flex items-center gap-2 px-8 py-4"
              >
                <Plus className="w-5 h-5" />
                Create Your First Listing
              </Link>
            )}
          </motion.div>
        )}

        {/* Listings Grid */}
        {!loading && sortedListings.length > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sortedListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                variants={item}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  {/* Listing Image */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-slate-300" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge variant={listing.status === 'published' ? 'success' : 'warning'} className="backdrop-blur-sm">
                        {listing.status === 'published' ? '● Published' : '○ Draft'}
                      </Badge>
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreviewListing(listing)}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-lg transition-colors"
                          title="Quick View"
                        >
                          <Eye className="w-4 h-4 text-slate-700" />
                        </button>
                        <button
                          onClick={() => setEditingListing(listing)}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4 text-slate-700" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Listing Details */}
                  <CardContent className="p-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {listing.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="space-y-2 mb-4">
                      {listing.category && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Package className="w-3.5 h-3.5" />
                          <span>{listing.category.name}</span>
                        </div>
                      )}
                      {listing.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{listing.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-bold text-foreground">
                          €{listing.price?.toFixed(2) || '0.00'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDuplicate(listing)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => setDeletingListing(listing)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewListing} onOpenChange={() => setPreviewListing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Listing Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">{previewListing?.title}</h3>
              <p className="text-muted-foreground">{previewListing?.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="text-foreground font-semibold">{previewListing?.category?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Price</label>
                <p className="text-foreground font-semibold">€{previewListing?.price?.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-foreground font-semibold">{previewListing?.location || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-foreground font-semibold capitalize">{previewListing?.status}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
