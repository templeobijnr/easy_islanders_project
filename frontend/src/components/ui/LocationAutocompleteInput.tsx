/**
 * LocationAutocompleteInput - Autocomplete input for location search
 * 
 * Features:
 * - Debounced search with API integration
 * - Dropdown suggestions from database + OpenStreetMap
 * - Keyboard navigation (↑↓ arrows, Enter, Esc)
 * - "Use my location" button with geolocation
 * - Loading states and error handling
 * - Mobile-friendly and accessible
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import axios from 'axios';
import config from '@/config';

export interface LocationSuggestion {
    label: string;
    city: string;
    district: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    source: 'db' | 'osm';
}

export interface LocationData {
    latitude: number;
    longitude: number;
    city: string;
    district: string;
    address: string;
}

interface LocationAutocompleteInputProps {
    value?: string;
    onLocationSelect: (location: LocationData) => void;
    placeholder?: string;
    showUseMyLocation?: boolean;
    disabled?: boolean;
    className?: string;
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
    value = '',
    onLocationSelect,
    placeholder = 'Search for address, city, or area...',
    showUseMyLocation = true,
    disabled = false,
    className = '',
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout>();

    // Update input value when prop changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Debounced search function
    const searchLocations = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('access_token');
            const response = await axios.get(
                `${config.API_BASE_URL}/api/v1/real_estate/geo/autocomplete/`,
                {
                    params: { q: query, limit: 5 },
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );

            const results = response.data?.results || [];
            setSuggestions(results);
            setIsOpen(results.length > 0);
            setSelectedIndex(-1);
        } catch (err) {
            console.error('Location search error:', err);
            setError('Failed to search locations');
            setSuggestions([]);
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle input change with debouncing
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            searchLocations(newValue);
        }, 300);
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
        setInputValue(suggestion.label);
        setIsOpen(false);
        setSuggestions([]);
        setSelectedIndex(-1);

        if (suggestion.latitude !== null && suggestion.longitude !== null) {
            onLocationSelect({
                latitude: suggestion.latitude,
                longitude: suggestion.longitude,
                city: suggestion.city,
                district: suggestion.district,
                address: suggestion.address || suggestion.label,
            });
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // Handle "Use my location" button
    const handleUseMyLocation = async () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setGeoLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
                    const response = await axios.get(
                        `${config.API_BASE_URL}/api/v1/real_estate/geo/reverse/`,
                        {
                            params: { lat: latitude, lng: longitude },
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                        }
                    );

                    const data = response.data;
                    const locationData: LocationData = {
                        latitude,
                        longitude,
                        city: data.city || '',
                        district: data.district || '',
                        address: data.address || '',
                    };

                    setInputValue(data.address || `${data.city}, ${data.district}`);
                    onLocationSelect(locationData);
                } catch (err) {
                    console.error('Reverse geocoding error:', err);
                    setError('Failed to get address for your location');
                } finally {
                    setGeoLoading(false);
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('Failed to get your location. Please check permissions.');
                setGeoLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className={`relative ${className}`}>
            <div className="flex gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (suggestions.length > 0) {
                                setIsOpen(true);
                            }
                        }}
                        placeholder={placeholder}
                        disabled={disabled || geoLoading}
                        className="pl-10 pr-10"
                        aria-label="Location search"
                        aria-autocomplete="list"
                        aria-controls="location-suggestions"
                        aria-expanded={isOpen}
                    />
                    {loading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>

                {/* Use My Location Button */}
                {showUseMyLocation && (
                    <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={handleUseMyLocation}
                        disabled={disabled || geoLoading}
                        className="flex-shrink-0"
                        title="Use my current location"
                    >
                        {geoLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Navigation className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Use my location</span>
                    </Button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-2 p-2 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
                    {error}
                </div>
            )}

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    id="location-suggestions"
                    role="listbox"
                    className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={`${suggestion.source}-${index}`}
                            type="button"
                            role="option"
                            aria-selected={index === selectedIndex}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className={`
                w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors
                flex items-start gap-3 border-b border-slate-100 last:border-b-0
                ${index === selectedIndex ? 'bg-slate-50' : ''}
              `}
                        >
                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900 truncate">
                                    {suggestion.label}
                                </div>
                                {suggestion.city && (
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {suggestion.city}
                                        {suggestion.district && ` • ${suggestion.district}`}
                                    </div>
                                )}
                                <div className="text-xs text-slate-400 mt-0.5">
                                    {suggestion.source === 'db' ? 'From your locations' : 'OpenStreetMap'}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No Results Message */}
            {isOpen && !loading && suggestions.length === 0 && inputValue.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center text-sm text-slate-500">
                    No locations found. Try a different search term.
                </div>
            )}
        </div>
    );
};

export default LocationAutocompleteInput;
