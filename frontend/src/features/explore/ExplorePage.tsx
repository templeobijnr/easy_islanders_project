/**
 * ExplorePage - Main Explore North Cyprus page
 * Premium glass morphism design with gradient backgrounds
 */

import React, { useEffect } from 'react';
import { useExplore } from './hooks/useExplore';
import CategoryTabs from './components/CategoryTabs';
import SubcategoryChips from './components/SubcategoryChips';
import ExploreSpotlight from './components/ExploreSpotlight';
import ExploreGrid from './components/ExploreGrid';
import HorizontalLane from './components/HorizontalLane';
import { EXPLORE_LANES } from './constants';
import { Listing } from './types';

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
  } = useExplore();

  // Set default category on mount
  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory, setActiveCategory]);

  // Handle listing click
  const handleListingClick = (listing: Listing) => {
    console.log('Listing clicked:', listing);
    // TODO: Open listing detail modal or navigate to detail page
  };

  // Get featured listings for spotlight
  const featuredListings = listings.filter((l) => l.is_featured).slice(0, 5);

  // Apply lane filters to listings
  const laneData = EXPLORE_LANES.map((lane) => ({
    ...lane,
    listings: lane.filter(listings),
  }));

  return (
    <div className="w-full">
      {/* Explore North Cyprus Header Card with Glass Effect */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200 shadow-2xl mb-6">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-lime-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        {/* Content */}
        <div className="relative backdrop-blur-sm bg-white/10 p-6 md:p-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-lime-600 shadow-lg">
              <span className="text-3xl md:text-4xl">🌴</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-slate-900">
                Explore North Cyprus
              </h1>
              <p className="text-sm md:text-lg text-slate-700 mt-1">
                Discover everything the island has to offer
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-6">
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          loading={categoriesLoading}
        />
      </div>

      {/* Subcategory Chips */}
      {activeCategoryObj && subcategories.length > 0 && (
        <div className="mb-6">
          <SubcategoryChips
            subcategories={subcategories}
            activeSubcategory={activeSubcategory}
            onSubcategoryChange={setActiveSubcategory}
            categoryName={activeCategoryObj.name}
          />
        </div>
      )}

      {/* Spotlight Carousel (Featured listings) */}
      {featuredListings.length > 0 && (
        <div className="mb-8 animate-fade-in">
          <ExploreSpotlight listings={featuredListings} onListingClick={handleListingClick} />
        </div>
      )}

      {/* Main Grid */}
      {activeCategory && (
        <div className="backdrop-blur-sm bg-white/60 rounded-3xl shadow-lg border border-white/40 p-6 md:p-8 mb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                {activeCategoryObj?.name || 'All Listings'}
                {activeSubcategory && (
                  <span className="text-lime-600">
                    {' '}
                    / {subcategories.find((s) => s.slug === activeSubcategory)?.name}
                  </span>
                )}
              </h2>
              <p className="text-slate-600 mt-1">
                {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
              </p>
            </div>

            {/* Sort dropdown */}
            <div className="hidden md:block">
              <select className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 text-slate-700 font-medium hover:border-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-600 shadow-sm">
                <option>Most Recent</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <ExploreGrid
            listings={listings}
            loading={listingsLoading}
            onListingClick={handleListingClick}
            emptyMessage={`No ${activeCategoryObj?.name.toLowerCase()} found`}
          />
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

      {/* Trust Badges */}
      <div className="backdrop-blur-sm bg-gradient-to-r from-lime-200/40 via-emerald-200/40 to-sky-200/40 rounded-3xl border border-white/60 p-6 md:p-8 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-lime-600 shadow-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Verified Listings</h4>
              <p className="text-sm text-slate-700">All listings are verified for authenticity</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-lime-600 shadow-lg">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Secure Bookings</h4>
              <p className="text-sm text-slate-700">Your transactions are safe and protected</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-lime-600 shadow-lg">
              <span className="text-2xl">🤝</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Local Support</h4>
              <p className="text-sm text-slate-700">24/7 customer support in multiple languages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state when no category selected */}
      {!activeCategory && !categoriesLoading && (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 backdrop-blur-sm bg-white/40 rounded-3xl border border-white/60">
          <div className="text-6xl md:text-8xl mb-4">🌴</div>
          <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">
            Select a category to start exploring
          </h3>
          <p className="text-slate-700 text-center max-w-md">
            Choose from properties, cars, marketplace, events, activities, and more!
          </p>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
