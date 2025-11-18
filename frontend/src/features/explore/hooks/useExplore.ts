/**
 * Main hook for Explore page state management
 */

import { useState, useCallback } from 'react';
import { ExploreFilters } from '../types';
import { useCategories } from './useCategories';
import { useListings } from './useListings';

export function useExplore() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('-created_at');

  // Fetch categories
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  // Fetch listings based on active filters
  const {
    listings,
    loading: listingsLoading,
    error: listingsError,
    hasMore,
    fetchListings,
    refetch,
  } = useListings({
    category: activeCategory,
    subcategory: activeSubcategory,
    status: 'active',
    search: searchQuery,
    ordering: sortBy,
    autoFetch: !!activeCategory, // Only auto-fetch if category is selected
  });

  // Get active category object
  const activeCategoryObj = categories.find(c => c.slug === activeCategory) || null;

  // Get subcategories for active category
  const subcategories = activeCategoryObj?.subcategories || [];

  // Change category handler
  const handleCategoryChange = useCallback((categorySlug: string) => {
    setActiveCategory(categorySlug);
    setActiveSubcategory(null); // Reset subcategory when category changes
    setSearchQuery('');
  }, []);

  // Change subcategory handler
  const handleSubcategoryChange = useCallback((subcategorySlug: string | null) => {
    setActiveSubcategory(subcategorySlug);
  }, []);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Sort handler
  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setActiveCategory(null);
    setActiveSubcategory(null);
    setSearchQuery('');
    setSortBy('-created_at');
  }, []);

  // Build filters object
  const filters: ExploreFilters = {
    category: activeCategory,
    subcategory: activeSubcategory,
    search: searchQuery,
    sortBy: sortBy as any,
  };

  return {
    // Data
    categories,
    listings,
    subcategories,
    activeCategoryObj,

    // State
    activeCategory,
    activeSubcategory,
    searchQuery,
    sortBy,
    filters,

    // Loading states
    categoriesLoading,
    listingsLoading,
    loading: categoriesLoading || listingsLoading,

    // Errors
    categoriesError,
    listingsError,
    error: categoriesError || listingsError,

    // Pagination
    hasMore,

    // Actions
    setActiveCategory: handleCategoryChange,
    setActiveSubcategory: handleSubcategoryChange,
    setSearchQuery: handleSearch,
    setSortBy: handleSortChange,
    resetFilters,
    refetchListings: refetch,
    fetchListings,
  };
}
