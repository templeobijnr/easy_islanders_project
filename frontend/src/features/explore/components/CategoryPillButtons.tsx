/**
 * CategoryPillButtons - Compact pill-style category buttons
 * Matches the design from the screenshot with horizontally scrollable pills
 */

import React from 'react';
import { Category } from '../types';

interface CategoryPillButtonsProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (slug: string) => void;
  className?: string;
}

// Icon emoji mapping for categories
const categoryEmojis: Record<string, string> = {
  'real-estate': '🏠',
  'vehicles': '🚗',
  'electronics': '⚡',
  'household-items': '🛋️',
  'products': '🛍️',
  'events': '🎉',
  'activities': '🏃',
  'services': '💼',
  'appointments': '📅',
};

export const CategoryPillButtons: React.FC<CategoryPillButtonsProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  className = '',
}) => {
  return (
    <div className={`flex gap-3 overflow-x-auto pb-3 scrollbar-hide ${className}`}>
      {categories.map((category) => {
        const isActive = activeCategory === category.slug;
        const emoji = categoryEmojis[category.slug] || '📦';

        return (
          <button
            key={category.slug}
            onClick={() => onCategoryChange(category.slug)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              isActive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <span className="text-base">{emoji}</span>
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryPillButtons;
