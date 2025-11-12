import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCategories } from '../../../hooks/useCategories';
import { useListings } from '../../../hooks/useListings';
import ListingCardFactory from '../components/ListingCardFactory';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Search } from 'lucide-react';

export const BrowseListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const categorySlug = searchParams.get('category') || undefined;
  const statusFilter = searchParams.get('status') || undefined;

  const { categories, isLoading: categoriesLoading } = useCategories();
  const { listings, isLoading: listingsLoading, error } = useListings({
    filters: {
      category: categorySlug,
      status: statusFilter,
      search: searchQuery,
    }
  });

  const selectedCategory = categories.find(c => c.slug === categorySlug);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('search', query);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleCategoryFilter = (slug: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (slug) {
      newParams.set('category', slug);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleListingClick = (id: string) => {
    navigate(`/listings/${id}`);
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Browse Listings</h1>
        <p className="text-gray-600">
          Explore our marketplace with {listings.length} active listings
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <div className="col-span-1">
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          {categoriesLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleCategoryFilter(null)}
                className={`
                  w-full text-left p-3 rounded-lg transition-colors
                  ${
                    !selectedCategory
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'hover:bg-gray-100'
                  }
                `}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryFilter(cat.slug)}
                  className={`
                    w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2
                    ${
                      selectedCategory?.id === cat.id
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'hover:bg-gray-100'
                    }
                  `}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <p className="text-sm">{cat.name}</p>
                    <p className="text-xs text-gray-500">
                      {listings.filter(l => l.category_slug === cat.slug).length} listings
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Status Filter */}
          <div className="mt-8">
            <h3 className="font-semibold mb-3 text-sm">Status</h3>
            <div className="space-y-2">
              {['active', 'draft', 'paused'].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilter === status}
                    onChange={() => {
                      const newParams = new URLSearchParams(searchParams);
                      if (statusFilter === status) {
                        newParams.delete('status');
                      } else {
                        newParams.set('status', status);
                      }
                      setSearchParams(newParams);
                    }}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Listings Grid */}
        <div className="col-span-3">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error.message}
            </div>
          )}

          {listingsLoading ? (
            <div className="flex items-center justify-center h-96">
              <p>Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96">
              <p className="text-gray-500 mb-4">No listings found</p>
              <Button onClick={() => navigate('/listings/create')}>
                Create First Listing
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {listings.length} listing{listings.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {listings.map(listing => (
                  <ListingCardFactory
                    key={listing.id}
                    listing={listing}
                    onClick={() => handleListingClick(listing.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseListingsPage;
