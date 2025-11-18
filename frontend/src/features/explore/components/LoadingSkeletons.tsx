/**
 * LoadingSkeletons - Skeleton screens for loading states
 * Provides better UX while content loads
 */

import React from 'react';

// Card Skeleton for Grid View
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-card overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 animate-shimmer" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-neutral-200 rounded-lg w-3/4" />

        {/* Price & Location */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-neutral-200 rounded-lg w-24" />
          <div className="h-4 bg-neutral-200 rounded-lg w-20" />
        </div>

        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-6 bg-neutral-200 rounded-full w-16" />
          <div className="h-6 bg-neutral-200 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
};

// Grid Skeleton
export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 9 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-card overflow-hidden animate-pulse">
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="w-48 h-32 rounded-xl bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 animate-shimmer flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-neutral-200 rounded-lg w-2/3" />
          <div className="h-4 bg-neutral-200 rounded-lg w-1/3" />
          <div className="h-4 bg-neutral-200 rounded-lg w-1/2" />
          <div className="flex gap-2">
            <div className="h-6 bg-neutral-200 rounded-full w-20" />
            <div className="h-6 bg-neutral-200 rounded-full w-24" />
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col items-end justify-between">
          <div className="h-8 bg-neutral-200 rounded-lg w-24" />
          <div className="h-6 bg-slate-200 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
};

// List Skeleton
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <ListItemSkeleton key={idx} />
      ))}
    </div>
  );
};

// Category Tab Skeleton
export const CategoryTabsSkeleton: React.FC = () => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-200 animate-pulse"
        >
          <div className="w-6 h-6 bg-neutral-300 rounded-full" />
          <div className="h-4 bg-neutral-300 rounded w-20" />
        </div>
      ))}
    </div>
  );
};

// Spotlight Carousel Skeleton
export const SpotlightSkeleton: React.FC = () => {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-card overflow-hidden animate-pulse">
      <div className="h-96 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 animate-shimmer relative">
        {/* Content overlay skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-3">
          <div className="h-8 bg-neutral-300 rounded-lg w-3/4" />
          <div className="h-6 bg-neutral-300 rounded-lg w-1/2" />
          <div className="flex gap-2">
            <div className="h-8 bg-neutral-300 rounded-lg w-24" />
            <div className="h-8 bg-neutral-300 rounded-lg w-28" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Filter Sidebar Skeleton
export const FilterSidebarSkeleton: React.FC = () => {
  return (
    <div className="w-80 bg-card/80 backdrop-blur-md rounded-2xl border border-border shadow-card p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-5 bg-neutral-200 rounded w-24" />
        <div className="h-4 bg-neutral-200 rounded w-16" />
      </div>

      {/* Filter sections */}
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="space-y-3">
          <div className="h-4 bg-neutral-200 rounded w-32" />
          <div className="h-10 bg-neutral-200 rounded-lg" />
        </div>
      ))}

      {/* Apply button */}
      <div className="h-12 bg-neutral-200 rounded-xl" />
    </div>
  );
};

// Search Bar Skeleton
export const SearchBarSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="h-16 bg-neutral-200 rounded-full animate-pulse" />
    </div>
  );
};

export default {
  CardSkeleton,
  GridSkeleton,
  ListItemSkeleton,
  ListSkeleton,
  CategoryTabsSkeleton,
  SpotlightSkeleton,
  FilterSidebarSkeleton,
  SearchBarSkeleton,
};
