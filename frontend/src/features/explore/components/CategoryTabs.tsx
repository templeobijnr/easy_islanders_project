/**
 * CategoryTabs - Horizontal category navigation
 * Desktop-first, responsive design
 */

import React from 'react';
import { Category } from '../types';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (categorySlug: string) => void;
  loading?: boolean;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 px-6 py-3 rounded-full bg-slate-200 animate-pulse"
            style={{ width: '120px', height: '44px' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 md:gap-3 pb-2">
        {categories.map((category) => {
          const isActive = activeCategory === category.slug;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.slug)}
              className={`
                flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3
                rounded-full font-medium text-sm md:text-base
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-lime-600 text-white shadow-lg shadow-lime-600/30 scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-lime-600 hover:text-lime-600 hover:shadow-md'
                }
              `}
              style={{
                backgroundColor: isActive ? category.color : undefined,
              }}
            >
              <span className="text-lg md:text-xl">{category.icon}</span>
              <span className="whitespace-nowrap">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
