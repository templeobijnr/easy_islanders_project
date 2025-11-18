/**
 * useAutocomplete - Fetch autocomplete suggestions
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Category } from '../types';

interface AutocompleteSuggestion {
  id: string;
  title: string;
  category: string;
  location?: string;
  price?: string;
  image?: string | null;
}

export function useAutocomplete(query: string, categories: Category[]) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Don't fetch if query is too short
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API endpoint when backend is ready
        // For now, use mock data based on query
        const mockSuggestions = generateMockSuggestions(query, categories);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));

        setSuggestions(mockSuggestions);

        // Production code:
        // const response = await axios.get('/api/explore/search/', {
        //   params: { q: query, limit: 5 }
        // });
        // setSuggestions(response.data.suggestions);
      } catch (err) {
        console.error('Autocomplete error:', err);
        setError(err as Error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [query, categories]);

  return { suggestions, loading, error };
}

// Mock suggestions generator (remove when backend API is ready)
function generateMockSuggestions(query: string, categories: Category[]): AutocompleteSuggestion[] {
  const q = query.toLowerCase();
  const suggestions: AutocompleteSuggestion[] = [];

  // Sample data
  const sampleListings = [
    { id: '1', title: 'Luxury Beach Villa in Kyrenia', category: 'Real Estate', location: 'Kyrenia', price: '€500,000', image: null },
    { id: '2', title: 'Modern Apartment in Famagusta', category: 'Real Estate', location: 'Famagusta', price: '€200,000', image: null },
    { id: '3', title: 'Professional Cleaning Service', category: 'Services', location: 'Nicosia', price: '€50/hour', image: null },
    { id: '4', title: 'Airport Transfer Service', category: 'Services', location: 'All Cyprus', price: '€40', image: null },
    { id: '5', title: 'Car Rental - Luxury SUV', category: 'Vehicles', location: 'Kyrenia', price: '€80/day', image: null },
    { id: '6', title: 'Beachfront Restaurant', category: 'Restaurants', location: 'Girne', price: '€€€', image: null },
    { id: '7', title: 'Sunset Yacht Tour', category: 'Events', location: 'Kyrenia Harbor', price: '€150/person', image: null },
    { id: '8', title: 'Villa with Pool and Garden', category: 'Real Estate', location: 'Esentepe', price: '€450,000', image: null },
    { id: '9', title: 'Plumbing Service 24/7', category: 'Services', location: 'All Cyprus', price: '€60/hour', image: null },
    { id: '10', title: 'Electric Bike Rental', category: 'Vehicles', location: 'Lefkosa', price: '€25/day', image: null },
  ];

  // Filter by query match
  const filtered = sampleListings.filter(listing =>
    listing.title.toLowerCase().includes(q) ||
    listing.category.toLowerCase().includes(q) ||
    listing.location.toLowerCase().includes(q)
  );

  return filtered.slice(0, 5);
}
