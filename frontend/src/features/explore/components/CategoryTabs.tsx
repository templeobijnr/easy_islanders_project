/**
 * CategoryTabs - Horizontal category navigation with glass morphism
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
            className="flex-shrink-0 px-6 py-3 rounded-2xl bg-white/40 backdrop-blur-sm animate-pulse border border-white/60"
            style={{ width: '140px', height: '52px' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 pb-2">
        {categories.map((category) => {
          const isActive = activeCategory === category.slug;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.slug)}
              className={`
                flex-shrink-0 flex items-center gap-3 px-5 md:px-7 py-3 md:py-3.5
                rounded-2xl font-semibold text-sm md:text-base
                transition-all duration-300 shadow-lg
                ${
                  isActive
                    ? 'bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200 text-slate-900 scale-105 shadow-xl border-2 border-white'
                    : 'backdrop-blur-sm bg-white/70 text-slate-700 border border-white/60 hover:bg-white/90 hover:scale-105 hover:shadow-xl'
                }
              `}
            >
              <span className="text-xl md:text-2xl">{category.icon}</span>
              <span className="whitespace-nowrap font-bold">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
