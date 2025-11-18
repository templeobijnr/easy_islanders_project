/**
 * PremiumExplorePage - Redesigned with Airbnb-like premium aesthetics
 * Features: Glassmorphism, premium gradients, micro-interactions, enhanced typography
 */

import React, { useEffect, useState } from 'react';
import { useExplore } from './hooks/useExplore';
import CategoryPillButtons from './components/CategoryPillButtons';
import SubcategoryPillButtons from './components/SubcategoryPillButtons';
import ExploreSpotlight from './components/ExploreSpotlight';
import ExploreGrid from './components/ExploreGrid';
import HorizontalLane from './components/HorizontalLane';
import GlobalSearchBar from './components/GlobalSearchBar';
import AdvancedFiltersSidebar from './components/AdvancedFiltersSidebar';
import ViewToggle, { ViewMode } from './components/ViewToggle';
import { GridSkeleton, SpotlightSkeleton } from './components/LoadingSkeletons';
import ListingDetailModal from './components/ListingDetailModal';
import { EXPLORE_LANES } from './constants';
import { Listing } from './types';
import { useChat } from '../../shared/context/ChatContext';
import { SlidersHorizontal, Search, MapPin, Calendar, Users, Star, Heart } from 'lucide-react';
import { motion, AnimatePresence as FMAnimatePresence } from 'framer-motion';

// Type-safe wrapper for AnimatePresence to fix TypeScript issues
const AnimatePresence = FMAnimatePresence as React.ComponentType<React.PropsWithChildren<{ mode?: "wait" | "sync" }>>;

const PremiumExplorePage: React.FC = () => {
  const {
    categories,
    listings,
    subcategories,
    activeCategoryObj,
    activeCategory,
    activeSubcategory,
    categoriesLoading,
    listingsLoading,
    setActiveCategory,
    setActiveSubcategory,
    filters,
    setSearchQuery,
    setSortBy,
    resetFilters,
  } = useExplore();

  const { send } = useChat();

  // Premium state management
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);

  // Set default category on mount
  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory, setActiveCategory]);

  // Premium interaction handlers
  const handleListingClick = (listing: Listing) => {
    setSelectedListing(listing);
    setDetailModalOpen(true);
  };

  const handleToggleSave = (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedListings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listingId)) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });
  };

  const handleBooking = (listingId: string, dates: { checkIn: string; checkOut: string; guests: number }) => {
    setDetailModalOpen(false);
    const listing = selectedListing;
    if (!listing) return;

    const summaryParts: string[] = [];
    if (listing.category?.name) summaryParts.push(listing.category.name);
    if (listing.subcategory?.name) summaryParts.push(listing.subcategory.name);
    if (listing.location) summaryParts.push(listing.location);

    const messageLines = [
      "I'd like to book this listing from Explore North Cyprus:",
      `"${listing.title}"`,
      summaryParts.length > 0 ? `(${summaryParts.join(' • ')})` : '',
      '',
      `Check-in: ${dates.checkIn}`,
      `Check-out: ${dates.checkOut}`,
      `Guests: ${dates.guests}`,
      '',
      'Can you help me complete this booking?',
      `(internal id: ${listing.id})`,
    ].filter(Boolean);

    send(messageLines.join('\n'));
  };

  const handleCloseModal = () => {
    setDetailModalOpen(false);
    setSelectedListing(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    console.log('Filters changed:', newFilters);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  // Premium data preparation
  const featuredListings = listings.filter((l) => l.is_featured).slice(0, 5);
  const laneData = EXPLORE_LANES.map((lane) => ({
    ...lane,
    listings: lane.filter(listings),
  }));

  // Premium header component
  const PremiumHeader = () => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative mb-8"
    >
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sunset-50 via-background to-gold-50 rounded-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(8,145,178,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(132,204,22,0.08),transparent_60%)]" />
      
      <div className="relative px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <h1 className="display-large bg-gradient-to-r from-foreground via-foreground to-foreground bg-clip-text text-transparent mb-4">
              Find your perfect stay
            </h1>
            <p className="body-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover extraordinary properties, unique experiences, and local gems in North Cyprus
            </p>
          </motion.div>

          {/* Premium Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/40">
              <GlobalSearchBar
                onSearch={handleSearch}
                categories={categories}
                recentSearches={recentSearches}
                onClearRecent={clearRecentSearches}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  // Premium filters bar
  const PremiumFiltersBar = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mb-8"
    >
      <div className="bg-card/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-border">
        {/* Category Pills */}
        {!categoriesLoading && categories.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Categories</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-xl border border-border hover:border-neutral-300 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
            <CategoryPillButtons
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
        )}

        {/* Subcategory Pills */}
        {activeCategoryObj && subcategories.length > 0 && (
          <div className="pt-4 border-t border-neutral-100">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Subcategories</h4>
            <SubcategoryPillButtons
              subcategories={subcategories}
              activeSubcategory={activeSubcategory}
              onSubcategoryChange={setActiveSubcategory}
            />
          </div>
        )}
      </div>
    </motion.div>
  );

  // Premium spotlight carousel
  const PremiumSpotlight = () => (
    <AnimatePresence>
      {featuredListings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
            <div className="bg-card/60 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="heading-2 mb-2 text-foreground">Featured Experiences</h2>
                <p className="body text-muted-foreground">Handpicked selections just for you</p>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-current" />
                <span className="text-sm font-medium text-muted-foreground">Premium Selection</span>
              </div>
            </div>
            <ExploreSpotlight listings={featuredListings} onListingClick={handleListingClick} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Premium listings grid
  const PremiumListingsGrid = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="flex gap-8"
    >
      {/* Premium Filters Sidebar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="hidden lg:block flex-shrink-0 w-80"
          >
            <div className="bg-card/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-border sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Clear all
                </button>
              </div>
              <AdvancedFiltersSidebar
                category={activeCategoryObj}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={resetFilters}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Main Content */}
      <div className="flex-1">
        <div className="bg-card/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-border overflow-hidden">
          {/* Premium Header */}
          <div className="p-8 border-b border-neutral-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="heading-2 text-foreground">
                    {activeCategoryObj?.name || 'All Listings'}
                  </h2>
                  {activeSubcategory && (
                    <span className="text-2xl font-medium text-muted-foreground">
                      / {subcategories.find((s) => s.slug === activeSubcategory)?.name}
                    </span>
                  )}
                </div>
                <p className="body-large text-muted-foreground">
                  {listings.length} {listings.length === 1 ? 'experience' : 'experiences'} available
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* View Toggle */}
                <ViewToggle mode={viewMode} onChange={setViewMode} />

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none px-4 py-3 pr-10 rounded-xl bg-background/80 backdrop-blur-sm border border-border text-foreground font-medium hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    <option value="-created_at">Most Recent</option>
                    <option value="price">Price: Low to High</option>
                    <option value="-price">Price: High to Low</option>
                    <option value="-views">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Listings */}
          <div className="p-8">
            {listingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse">
                    <div className="bg-neutral-200 rounded-2xl aspect-video mb-4"></div>
                    <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="group cursor-pointer"
                    onClick={() => handleListingClick(listing)}
                    onMouseEnter={() => setHoveredListing(listing.id)}
                    onMouseLeave={() => setHoveredListing(null)}
                  >
                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                      {/* Premium Image Container */}
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={listing.images?.[0]?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        {/* Premium Save Button */}
                        <button
                          onClick={(e) => handleToggleSave(listing.id, e)}
                          className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
                        >
                          <Heart 
                            className={`w-5 h-5 ${savedListings.has(listing.id) ? 'text-rose-500 fill-current' : 'text-gray-600'}`} 
                          />
                        </button>

                        {/* Premium Badge */}
                        {listing.is_featured && (
                          <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold rounded-full shadow-lg">
                            <Star className="w-3 h-3 inline mr-1" />
                            Featured
                          </div>
                        )}

                        {/* Premium Hover Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                          <div className="absolute bottom-4 left-4 right-4">
                            <button className="w-full py-3 bg-white/90 backdrop-blur-sm text-gray-900 font-semibold rounded-xl hover:bg-white transition-all">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Premium Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                              {listing.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{listing.location || 'North Cyprus'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              £{listing.price || '0'}
                            </div>
                            <div className="text-sm text-gray-500">per night</div>
                          </div>
                        </div>

                        {/* Premium Features */}
                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                          {listing.dynamic_fields?.guests && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{listing.dynamic_fields.guests} guests</span>
                            </div>
                          )}
                          {listing.dynamic_fields?.bedrooms && (
                            <div className="flex items-center gap-1">
                              <span>{listing.dynamic_fields.bedrooms} beds</span>
                            </div>
                          )}
                          {listing.dynamic_fields?.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-current" />
                              <span>{listing.dynamic_fields.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Premium Category Badge */}
                        {listing.category?.name && (
                          <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {listing.category.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {listings.length === 0 && !listingsLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No experiences found</h3>
                <p className="text-gray-600">Try adjusting your filters or search criteria</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Premium horizontal lanes
  const PremiumHorizontalLanes = () => (
    <AnimatePresence>
      {activeCategory && listings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-12 mb-16"
        >
          {laneData.map((lane, index) => (
            lane.listings.length > 0 && (
              <motion.div
                key={lane.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white/60 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/40"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lane.emoji}</span>
                    <h3 className="text-2xl font-bold text-gray-900">{lane.title}</h3>
                  </div>
                  <button className="text-rose-600 hover:text-rose-700 font-medium">
                    View all →
                  </button>
                </div>
                <HorizontalLane
                  title={lane.title}
                  emoji={lane.emoji}
                  listings={lane.listings}
                  onListingClick={handleListingClick}
                />
              </motion.div>
            )
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Premium trust indicators
  const PremiumTrustIndicators = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="mb-16"
    >
      <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50 rounded-3xl p-8 shadow-xl border border-white/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">✅</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Verified Hosts</h4>
            <p className="text-gray-600 text-sm">Every host is verified for your peace of mind</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">🛡️</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Secure Payments</h4>
            <p className="text-gray-600 text-sm">Your payments are protected and secure</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">💬</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">24/7 Support</h4>
            <p className="text-gray-600 text-sm">Round-the-clock assistance in multiple languages</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <PremiumHeader />

        {/* Premium Filters */}
        <PremiumFiltersBar />

        {/* Premium Spotlight */}
        <PremiumSpotlight />

        {/* Premium Main Content */}
        {activeCategory && (
          <PremiumListingsGrid />
        )}

        {/* Premium Horizontal Lanes */}
        <PremiumHorizontalLanes />

        {/* Premium Trust Indicators */}
        <PremiumTrustIndicators />

        {/* Empty State */}
        {!activeCategory && !categoriesLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="text-8xl mb-6">🏝️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Start your North Cyprus adventure</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Choose a category above to discover amazing properties, experiences, and local gems
            </p>
          </motion.div>
        )}

        {/* Premium Listing Detail Modal */}
        <AnimatePresence>
          {detailModalOpen && selectedListing && (
            <ListingDetailModal
              listing={selectedListing}
              isOpen={detailModalOpen}
              onClose={handleCloseModal}
              onBook={handleBooking}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PremiumExplorePage;
