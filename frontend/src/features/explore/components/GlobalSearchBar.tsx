/**
 * GlobalSearchBar - Premium search with autocomplete and voice input
 * Features: Fuzzy search, category scoping, recent searches, voice input
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MapPin, Calendar, X, Clock, TrendingUp } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { Category } from '../types';

interface GlobalSearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  categories: Category[];
  recentSearches?: string[];
  onClearRecent?: () => void;
  placeholder?: string;
  showQuickFilters?: boolean;
}

interface SearchFilters {
  category?: string;
  location?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onSearch,
  categories,
  recentSearches = [],
  onClearRecent,
  placeholder = 'Search properties, services, events, and more...',
  showQuickFilters = true,
}) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const { suggestions, loading } = useAutocomplete(debouncedQuery, categories);

  // Check voice search support
  useEffect(() => {
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Handle voice search
  const handleVoiceSearch = () => {
    if (!voiceSupported) {
      alert('Voice search is not supported in your browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceActive(true);
    };

    recognition.onend = () => {
      setVoiceActive(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      onSearch(transcript, {});
      inputRef.current?.blur();
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setVoiceActive(false);
      if (event.error !== 'no-speech') {
        alert(`Voice search error: ${event.error}`);
      }
    };

    recognition.start();
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, {});
      inputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestionQuery: string) => {
    setQuery(suggestionQuery);
    onSearch(suggestionQuery, {});
    setFocused(false);
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };

    if (focused) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [focused]);

  const showDropdown = focused && (suggestions.length > 0 || recentSearches.length > 0);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative w-full px-12 py-4 rounded-full bg-white/95 backdrop-blur-md border-2 border-[hsl(var(--ocean-300))] shadow-lg transition-all duration-300 hover:border-[hsl(var(--ocean-300))] focus-within:ring-4 focus-within:ring-[hsl(var(--ocean-500))]/30 focus-within:border-[hsl(var(--ocean-400))] ${
            focused ? 'ring-4 ring-[hsl(var(--ocean-500))]/30 border-[hsl(var(--ocean-400))]' : ''
          }`}
        >
          {/* Search Icon */}
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--sand-500))] w-6 h-6" />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            className="w-full bg-transparent focus:outline-none text-[hsl(var(--sand-900))] placeholder:text-[hsl(var(--sand-600))] pr-32 text-base"
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-28 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[hsl(var(--sand-100))] rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-[hsl(var(--sand-600))]" />
            </button>
          )}

          {/* Quick Action Buttons */}
          {showQuickFilters && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                className="p-2 hover:bg-[hsl(var(--ocean-50))] rounded-full transition-colors group"
                title="Filter by location"
              >
                <MapPin className="w-5 h-5 text-[hsl(var(--ocean-600))] group-hover:text-[hsl(var(--ocean-700))]" />
              </button>

              <button
                type="button"
                className="p-2 hover:bg-[hsl(var(--ocean-50))] rounded-full transition-colors group"
                title="Filter by date"
              >
                <Calendar className="w-5 h-5 text-[hsl(var(--ocean-600))] group-hover:text-[hsl(var(--ocean-700))]" />
              </button>

              {voiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  disabled={voiceActive}
                  className={`p-2 rounded-full transition-all ${
                    voiceActive
                      ? 'bg-red-100 text-red-600 animate-pulse'
                      : 'hover:bg-[hsl(var(--ocean-50))] text-[hsl(var(--ocean-600))] hover:text-[hsl(var(--ocean-700))]'
                  }`}
                  title="Voice search"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Autocomplete Dropdown */}
        {showDropdown && (
          <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60 overflow-hidden z-50 animate-fade-in">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-3 border-b border-[hsl(var(--sand-200))]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[hsl(var(--sand-500))] uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Recent
                </p>
                {onClearRecent && (
                  <button
                    onClick={onClearRecent}
                    className="text-xs text-[hsl(var(--sand-500))] hover:text-[hsl(var(--ocean-600))] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
                {recentSearches.slice(0, 3).map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--ocean-50))] rounded-lg transition-colors flex items-center gap-2 group"
                  >
                    <Search className="w-4 h-4 text-[hsl(var(--sand-500))] group-hover:text-[hsl(var(--ocean-600))]" />
                    <span className="text-[hsl(var(--sand-700))] group-hover:text-[hsl(var(--sand-900))]">{search}</span>
                  </button>
                ))}
            </div>
          )}

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-semibold text-[hsl(var(--sand-500))] uppercase mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Suggestions
              </p>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion.title)}
                  className="w-full text-left px-3 py-2 hover:bg-lime-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {suggestion.image && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                        <img
                          src={suggestion.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[hsl(var(--sand-900))] truncate">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-[hsl(var(--sand-600))] truncate">
                        {suggestion.category}
                        {suggestion.location && ` • ${suggestion.location}`}
                        {suggestion.price && (
                          <span className="ml-1 font-semibold text-[hsl(var(--ocean-600))]">
                          {suggestion.price}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center">
              <div className="inline-block w-5 h-5 border-2 border-[hsl(var(--ocean-600))] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[hsl(var(--sand-600))] mt-2">Searching...</p>
            </div>
          )}

          {/* No Results */}
          {!loading && debouncedQuery && suggestions.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-[hsl(var(--sand-600))]">
                No results found for "{debouncedQuery}"
              </p>
              <p className="text-xs text-[hsl(var(--sand-500))] mt-1">
                Try different keywords or browse categories
              </p>
            </div>
          )}
        </div>
      )}

      {/* Voice Search Indicator */}
      {voiceActive && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Listening...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
