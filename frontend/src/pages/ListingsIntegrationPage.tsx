/**
 * Integration example page demonstrating:
 * - Categories and subcategories fetching
 * - Dynamic listing form
 * - Listing grid with category-specific renderers
 * - Filtering and search
 */

import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useListings } from '../hooks/useListings';
import DynamicListingForm from '../features/listings/components/DynamicListingForm';
import ListingCard from '../features/listings/components/ListingCard';
import { Category, CreateListingRequest } from '../types/schema';

type PageView = 'browse' | 'create' | 'details';

const ListingsIntegrationPage: React.FC = () => {
  const [view, setView] = useState<PageView>('browse');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Fetch categories
  const { categories, isLoading: categoriesLoading, error: categoriesError } =
    useCategories();

  // Fetch listings with optional filters
  const {
    listings,
    isLoading: listingsLoading,
    error: listingsError,
    createListing,
    searchListings,
    filterListings,
  } = useListings({
    autoFetch: true,
    filters: { status: 'active' },
  });

  // Handle category selection for creation
  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setView('create');
  };

  // Handle form submission
  const handleCreateListing = async (data: CreateListingRequest) => {
    try {
      await createListing(data);
      setView('browse');
      setSelectedCategory(null);
      alert('Listing created successfully!');
    } catch (error) {
      console.error('Failed to create listing:', error);
    }
  };

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await searchListings(searchQuery);
    }
  };

  // Handle category filter
  const handleCategoryFilter = async (slug: string) => {
    setSelectedCategoryFilter(slug);
    if (slug) {
      await filterListings({ category: slug });
    } else {
      await filterListings({});
    }
  };

  // Browse view
  if (view === 'browse') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Marketplace</h1>
            <p className="mt-2 text-gray-600">
              Browse listings from our community or create your own
            </p>
          </div>

          {/* Create Listing Button */}
          <div className="mb-8 flex justify-between items-center">
            <button
              onClick={() => setView('create')}
              className="rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700"
            >
              + Create Listing
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Filter */}
          {!categoriesLoading && categories.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Filter by Category
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryFilter('')}
                  className={`rounded-full px-4 py-2 font-medium transition-colors ${
                    selectedCategoryFilter === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryFilter(cat.slug)}
                    className={`rounded-full px-4 py-2 font-medium transition-colors ${
                      selectedCategoryFilter === cat.slug
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Listings Grid */}
          <div>
            {listingsLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : listingsError ? (
              <div className="rounded-lg bg-red-50 p-4 text-red-800">
                Error loading listings: {listingsError.message}
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-lg bg-gray-100 p-12 text-center">
                <p className="text-gray-600">No listings found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onBook={(id) => console.log('Book listing:', id)}
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Create view
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => {
                setView('browse');
                setSelectedCategory(null);
              }}
              className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Browse
            </button>

            {!selectedCategory ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900">
                  Create a Listing
                </h1>
                <p className="mt-2 text-gray-600">
                  Choose a category to get started
                </p>

                {/* Category Selection */}
                {categoriesLoading ? (
                  <div className="mt-8 flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  </div>
                ) : categoriesError ? (
                  <div className="mt-8 rounded-lg bg-red-50 p-4 text-red-800">
                    Error loading categories: {categoriesError.message}
                  </div>
                ) : (
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleSelectCategory(category)}
                        className="rounded-lg border-2 border-gray-200 p-4 text-left hover:border-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        {category.icon && (
                          <div className="mb-2 text-2xl">{category.icon}</div>
                        )}
                        <h3 className="font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {category.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">
                  Create {selectedCategory.name} Listing
                </h1>
                <p className="mt-2 text-gray-600">
                  Fill in the details below to create your listing
                </p>

                {/* Dynamic Form */}
                <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
                  <DynamicListingForm
                    category={selectedCategory}
                    onSubmit={handleCreateListing}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ListingsIntegrationPage;
