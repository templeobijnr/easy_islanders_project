/**
 * ExplorePage - Main Explore North Cyprus page
 * Premium glass morphism design with gradient backgrounds
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
import { SlidersHorizontal } from 'lucide-react';

const ExplorePage: React.FC = () => {
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

  // New state for enhanced features
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Set default category on mount
  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory, setActiveCategory]);

  // Handle listing click: Open detail modal
  const handleListingClick = (listing: Listing) => {
    setSelectedListing(listing);
    setDetailModalOpen(true);
  };

  // Handle booking from detail modal
  const handleBooking = (listingId: string, dates: { checkIn: string; checkOut: string; guests: number }) => {
    // Close modal
    setDetailModalOpen(false);

    // Send booking request to chat agent
    const listing = selectedListing;
    if (!listing) return;

    const summaryParts: string[] = [];
    if (listing.category?.name) {
      summaryParts.push(listing.category.name);
    }
    if (listing.subcategory?.name) {
      summaryParts.push(listing.subcategory.name);
    }
    if (listing.location) {
      summaryParts.push(listing.location);
    }

    const summary = summaryParts.join(' • ');

    const messageLines = [
      "I'd like to book this listing from Explore North Cyprus:",
      `"${listing.title}"`,
      summary ? `(${summary})` : '',
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

  // Handle modal close
  const handleCloseModal = () => {
    setDetailModalOpen(false);
    setSelectedListing(null);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Add to recent searches
    if (query && !recentSearches.includes(query)) {
      setRecentSearches((prev) => [query, ...prev.slice(0, 4)]);
    }
  };

  // Handle filters change
  const handleFiltersChange = (newFilters: typeof filters) => {
    // This would be handled by the useExplore hook
    // For now, just log
    console.log('Filters changed:', newFilters);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  // Get featured listings for spotlight
  const featuredListings = listings.filter((l) => l.is_featured).slice(0, 5);

  // Apply lane filters to listings
  const laneData = EXPLORE_LANES.map((lane) => ({
    ...lane,
    listings: lane.filter(listings),
  }));

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full px-6 md:px-8 lg:px-12 py-6">
        {/* Hero header - aligned with tokenized card theme */}
        <div className="mb-6 max-w-6xl mx-auto rounded-[var(--radius-xl)] bg-card border border-border shadow-[var(--shadow-card)]">
          {/* Clean Content */}
          <div className="px-6 md:px-10 py-8 md:py-10 flex flex-col gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-[var(--radius-lg)] bg-gradient-to-br from-ocean-100 to-ocean-200 border border-ocean-300">
                <span className="text-3xl md:text-4xl">🏝️</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-5xl font-bold text-foreground font-[family:var(--font-heading)]">
                  Explore North Cyprus
                </h1>
                <p className="text-base md:text-xl text-muted-foreground mt-2 font-[family:var(--font-body)]">
                  Discover properties, services, and experiences curated just for you
                </p>
              </div>
            </div>

            {/* Clean Global Search Bar */}
            <div className="w-full">
              <GlobalSearchBar
                onSearch={handleSearch}
                categories={categories}
                recentSearches={recentSearches}
                onClearRecent={clearRecentSearches}
              />
            </div>
          </div>
        </div>

      {/* Premium Category Navigation */}
      {!categoriesLoading && categories.length > 0 && (
        <div className="mb-6">
          <CategoryPillButtons
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
      )}

      {/* Premium Subcategory Pills */}
      {activeCategoryObj && subcategories.length > 0 && (
        <div className="mb-8">
          <SubcategoryPillButtons
            subcategories={subcategories}
            activeSubcategory={activeSubcategory}
            onSubcategoryChange={setActiveSubcategory}
          />
        </div>
      )}

      {/* Premium Spotlight Carousel (Featured listings) */}
      {listingsLoading && activeCategory ? (
        <div className="mb-12">
          <SpotlightSkeleton />
        </div>
      ) : (
        featuredListings.length > 0 && (
          <div className="mb-12 animate-fade-in">
            <ExploreSpotlight listings={featuredListings} onListingClick={handleListingClick} />
          </div>
        )
      )}

      {/* Clean Main Content: Filters + Listings */}
      {activeCategory && (
        <div className="flex gap-8 mb-12">
          {/* Clean Advanced Filters Sidebar */}
          {showFilters && (
            <div className="hidden lg:block flex-shrink-0">
              <AdvancedFiltersSidebar
                category={activeCategoryObj}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={resetFilters}
              />
            </div>
          )}

          {/* Clean Main Listings Area */}
          <div className="flex-1 glass-card p-6 md:p-8 shadow-[var(--shadow-card)]">
            {/* Clean Header with Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-[hsl(var(--sand-900))] font-[family:var(--font-heading)]">
                    {activeCategoryObj?.name || 'All Listings'}
                    {activeSubcategory && (
                      <span className="text-[hsl(var(--ocean-500))] font-normal">
                        {' '}
                        / {subcategories.find((s) => s.slug === activeSubcategory)?.name}
                      </span>
                    )}
                  </h2>

                  {/* Clean Filters Toggle (Mobile) */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden p-2 rounded-[var(--radius-md)] bg-[hsl(var(--sand-50))] border border-[hsl(var(--sand-200))] hover:border-[hsl(var(--ocean-300))] hover:bg-[hsl(var(--ocean-50))] transition-all"
                    title="Toggle filters"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[hsl(var(--sand-600))]" />
                  </button>
                </div>
                <p className="text-[hsl(var(--sand-600))] text-base font-[family:var(--font-body)]">
                  {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Clean View Toggle */}
                <ViewToggle mode={viewMode} onChange={setViewMode} />

                {/* Clean Sort Dropdown */}
                <select
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 rounded-[var(--radius-md)] bg-white border border-[hsl(var(--sand-200))] text-[hsl(var(--sand-700))] font-medium hover:border-[hsl(var(--ocean-300))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ocean-500))] focus:border-[hsl(var(--ocean-500))] font-[family:var(--font-body)]"
                >
                  <option value="-created_at">Most Recent</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="-views">Most Viewed</option>
                </select>
              </div>
            </div>

            {/* Listings Display */}
            {listingsLoading ? (
              <GridSkeleton count={9} />
            ) : (
              <ExploreGrid
                listings={listings}
                loading={false}
                onListingClick={handleListingClick}
                emptyMessage={`No ${activeCategoryObj?.name.toLowerCase()} found`}
              />
            )}
          </div>
        </div>
      )}

      {/* Horizontal Lanes */}
      {activeCategory && listings.length > 0 && (
        <div className="space-y-8 md:space-y-10 mb-8">
          {laneData.map(
            (lane) =>
              lane.listings.length > 0 && (
                <div key={lane.id} className="animate-fade-in">
                  <HorizontalLane
                    title={lane.title}
                    emoji={lane.emoji}
                    listings={lane.listings}
                    onListingClick={handleListingClick}
                  />
                </div>
              )
          )}
        </div>
      )}

      {/* Clean Trust Badges */}
      <div className="glass-card p-6 md:p-8 shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] bg-gradient-to-br from-[hsl(var(--ocean-50))] to-[hsl(var(--ocean-100))] border border-[hsl(var(--ocean-200))]">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <h4 className="font-semibold text-[hsl(var(--sand-900))] mb-1 text-base font-[family:var(--font-heading)]">Verified Listings</h4>
              <p className="text-[hsl(var(--sand-600))] text-sm font-[family:var(--font-body)]">Every listing is verified for authenticity and quality</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] bg-gradient-to-br from-[hsl(var(--ocean-50))] to-[hsl(var(--ocean-100))] border border-[hsl(var(--ocean-200))]">
              <span className="text-xl">🔒</span>
            </div>
            <div>
              <h4 className="font-semibold text-[hsl(var(--sand-900))] mb-1 text-base font-[family:var(--font-heading)]">Secure Bookings</h4>
              <p className="text-[hsl(var(--sand-600))] text-sm font-[family:var(--font-body)]">Your transactions are protected with bank-level security</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] bg-gradient-to-br from-[hsl(var(--ocean-50))] to-[hsl(var(--ocean-100))] border border-[hsl(var(--ocean-200))]">
              <span className="text-xl">🤝</span>
            </div>
            <div>
              <h4 className="font-semibold text-[hsl(var(--sand-900))] mb-1 text-base font-[family:var(--font-heading)]">Premium Support</h4>
              <p className="text-[hsl(var(--sand-600))] text-sm font-[family:var(--font-body)]">24/7 concierge service in multiple languages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Empty State */}
      {!activeCategory && !categoriesLoading && (
        <div className="flex flex-col items-center justify-center py-16 md:py-20 glass-card shadow-[var(--shadow-card)]">
          <div className="text-6xl md:text-8xl mb-4">🏝️</div>
          <h3 className="text-xl md:text-2xl font-semibold text-[hsl(var(--sand-900))] mb-2 font-[family:var(--font-heading)]">
            Begin Your Journey
          </h3>
          <p className="text-[hsl(var(--sand-600))] text-center max-w-md text-base font-[family:var(--font-body)]">
            Select from our curated collection of properties, services, and experiences
          </p>
        </div>
      )}

        {/* Listing Detail Modal */}
        <ListingDetailModal
          listing={selectedListing}
          isOpen={detailModalOpen}
          onClose={handleCloseModal}
          onBook={handleBooking}
        />
      </div>
    </div>
  );
};

export default ExplorePage;
