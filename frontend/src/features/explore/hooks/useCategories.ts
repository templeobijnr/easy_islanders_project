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

// Placeholder categories to display when API fails
const PLACEHOLDER_CATEGORIES: Category[] = [
  {
    id: '1',
    slug: 'real-estate',
    name: 'Real Estate',
    description: 'Properties for sale and rent',
    icon: 'home',
    color: '#6CC24A',
    is_bookable: true,
    is_active: true,
    is_featured_category: true,
    display_order: 1,
    schema: { fields: [] },
    subcategories: [
      { id: 1, slug: 'daily-rental', name: 'Daily Rental', display_order: 1 },
      { id: 2, slug: 'long-term', name: 'Long Term', display_order: 2 },
      { id: 3, slug: 'sale', name: 'Sale', display_order: 3 },
      { id: 4, slug: 'projects', name: 'Projects', display_order: 4 },
    ],
  },
  {
    id: '2',
    slug: 'vehicles',
    name: 'Vehicles',
    description: 'Cars and motorcycles',
    icon: 'car',
    color: '#4ECDC4',
    is_bookable: true,
    is_active: true,
    is_featured_category: true,
    display_order: 2,
    schema: { fields: [] },
    subcategories: [
      { id: 4, slug: 'car', name: 'Car', display_order: 1 },
      { id: 5, slug: 'motorcycle-scooter', name: 'Motorcycle/Scooter', display_order: 2 },
    ],
  },
  {
    id: '3',
    slug: 'services',
    name: 'Services',
    description: 'Professional services',
    icon: 'briefcase',
    color: '#AA96DA',
    is_bookable: true,
    is_active: true,
    is_featured_category: true,
    display_order: 3,
    schema: { fields: [] },
    subcategories: [
      { id: 6, slug: 'home-services', name: 'Home Services', display_order: 1 },
      { id: 7, slug: 'plumbing', name: 'Plumbing', display_order: 2 },
    ],
  },
];

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>(PLACEHOLDER_CATEGORIES);
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

      // Sort by display_order and hide beaches category from Explore
      const sorted = data.categories
        .filter((c) => c.slug !== 'beaches')
        .sort((a, b) => a.display_order - b.display_order);

      setCategories(sorted);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Keep placeholder categories on error
      console.warn('Using placeholder categories due to API error');
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
