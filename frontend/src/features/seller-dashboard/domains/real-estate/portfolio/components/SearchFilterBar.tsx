/**
 * SearchFilterBar Component
 *
 * Provides search, filter, and sort controls for listing management
 */

import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'inactive' | 'draft' | 'rented' | 'sold' | 'under-offer';
type SortOption = 'recent' | 'price-high' | 'price-low' | 'bookings' | 'views' | 'alphabetical';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  resultCount?: number;
  showStatusFilter?: boolean;
  showSortBy?: boolean;
  placeholder?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  resultCount,
  showStatusFilter = true,
  showSortBy = true,
  placeholder = 'Search listings...',
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent
                     placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter */}
        {showStatusFilter && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent
                       appearance-none bg-white cursor-pointer min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="rented">Rented</option>
              <option value="sold">Sold</option>
              <option value="under-offer">Under Offer</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Sort By */}
        {showSortBy && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortOption)}
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent
                       appearance-none bg-white cursor-pointer min-w-[180px]"
            >
              <option value="recent">Most Recent</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="bookings">Most Bookings</option>
              <option value="views">Most Views</option>
              <option value="alphabetical">A to Z</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-600">
            {resultCount === 0 ? (
              <span>No listings found</span>
            ) : resultCount === 1 ? (
              <span>Showing <strong>1</strong> listing</span>
            ) : (
              <span>Showing <strong>{resultCount}</strong> listings</span>
            )}
            {searchQuery && (
              <span> matching &quot;<strong>{searchQuery}</strong>&quot;</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Example usage:
 *
 * <SearchFilterBar
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   statusFilter={statusFilter}
 *   onStatusFilterChange={setStatusFilter}
 *   sortBy={sortBy}
 *   onSortByChange={setSortBy}
 *   resultCount={24}
 * />
 */
