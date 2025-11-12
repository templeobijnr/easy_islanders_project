/**
 * Hook for fetching and managing categories
 */

import { useState, useEffect, useCallback } from 'react';
import { Category, CategoriesResponse, SubCategoriesResponse, SubCategory } from '../types/schema';
import { apiClient } from '../services/api';

interface UseCategoriesOptions {
  autoFetch?: boolean;
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { autoFetch = true } = options;
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<CategoriesResponse>('/api/categories/');
      let categories: Category[] = [];
      if (Array.isArray(response.data)) {
        categories = response.data;
      } else if (response.data && 'categories' in response.data && Array.isArray(response.data.categories)) {
        categories = response.data.categories;
      }
      setCategories(categories);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch categories');
      setError(error);
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    }
  }, [autoFetch, fetchCategories]);

  const getCategoryBySlug = useCallback((slug: string) => {
    return categories.find((cat) => cat.slug === slug);
  }, [categories]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find((cat) => cat.id === id);
  }, [categories]);

  const getBookableCategories = useCallback(() => {
    return categories.filter((cat) => cat.is_bookable);
  }, [categories]);

  const getFeaturedCategories = useCallback(() => {
    return categories.filter((cat) => cat.is_featured_category);
  }, [categories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    getCategoryBySlug,
    getCategoryById,
    getBookableCategories,
    getFeaturedCategories,
  };
}

/**
 * Hook for fetching subcategories for a specific category
 */
export function useSubCategories(categorySlug?: string) {
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubcategories = useCallback(
    async (slug: string) => {
      if (!slug) {
        setSubcategories([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<SubCategoriesResponse>(
          `/api/categories/${slug}/subcategories/`
        );
        setSubcategories(response.data.subcategories || []);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch subcategories');
        setError(error);
        console.error('Error fetching subcategories:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (categorySlug) {
      fetchSubcategories(categorySlug);
    }
  }, [categorySlug, fetchSubcategories]);

  return {
    subcategories,
    isLoading,
    error,
    refetch: () => {
      if (categorySlug) {
        fetchSubcategories(categorySlug);
      }
    },
  };
}
