/**
 * ExplorePage - Main Explore North Cyprus page
 * Desktop-first, fully responsive design
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
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-lime-500 via-lime-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              🌴 Explore North Cyprus
            </h1>
            <p className="text-base md:text-xl text-lime-50">
              Discover properties, cars, activities, and everything North Cyprus has to offer
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Category Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            loading={categoriesLoading}
          />
        </div>

        {/* Subcategory Chips */}
        {activeCategoryObj && subcategories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">
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
          <div className="animate-fade-in">
            <ExploreSpotlight listings={featuredListings} onListingClick={handleListingClick} />
          </div>
        )}

        {/* Main Grid */}
        {activeCategory && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 md:p-8">
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

              {/* Sort dropdown (future enhancement) */}
              <div className="hidden md:block">
                <select className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:border-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-600">
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
          <div className="space-y-8 md:space-y-10">
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
        <div className="bg-gradient-to-r from-lime-50 to-emerald-50 rounded-2xl border border-lime-200 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="text-3xl md:text-4xl">✅</div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Verified Listings</h4>
                <p className="text-sm text-slate-600">All listings are verified for authenticity</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="text-3xl md:text-4xl">🔒</div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Secure Bookings</h4>
                <p className="text-sm text-slate-600">Your transactions are safe and protected</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="text-3xl md:text-4xl">🤝</div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Local Support</h4>
                <p className="text-sm text-slate-600">24/7 customer support in multiple languages</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state when no category selected */}
        {!activeCategory && !categoriesLoading && (
          <div className="flex flex-col items-center justify-center py-16 md:py-24">
            <div className="text-6xl md:text-8xl mb-4">🌴</div>
            <h3 className="text-xl md:text-2xl font-semibold text-slate-700 mb-2">
              Select a category to start exploring
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              Choose from properties, cars, marketplace, events, activities, and more!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
