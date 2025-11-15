/**
 * Hook to fetch and manage categories from the API
 */

import { useState, useEffect } from 'react';
import { Category, CategoriesResponse } from '../types';

interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/categories/?is_featured_category=true');

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const data: CategoriesResponse = await response.json();

      // Sort by display_order
      const sorted = data.categories.sort((a, b) => a.display_order - b.display_order);

      setCategories(sorted);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}
