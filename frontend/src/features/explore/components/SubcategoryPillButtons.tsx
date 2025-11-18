/**
 * SubcategoryPillButtons - Compact pill-style subcategory buttons
 * Shows below category pills when a category is selected
 */

import React from 'react';
import { SubCategory } from '../types';

interface SubcategoryPillButtonsProps {
  subcategories: SubCategory[];
  activeSubcategory: string | null;
  onSubcategoryChange: (slug: string | null) => void;
  categoryName?: string;
  className?: string;
}

export const SubcategoryPillButtons: React.FC<SubcategoryPillButtonsProps> = ({
  subcategories,
  activeSubcategory,
  onSubcategoryChange,
  categoryName,
  className = '',
}) => {
  if (subcategories.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Optional header */}
      {categoryName && (
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
          {categoryName} Categories
        </p>
      )}

      {/* Subcategory pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* "All" button */}
        <button
          onClick={() => onSubcategoryChange(null)}
          className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeSubcategory === null
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          All
        </button>

        {/* Subcategory buttons */}
        {subcategories.map((subcategory) => {
          const isActive = activeSubcategory === subcategory.slug;

          return (
            <button
              key={subcategory.slug}
              onClick={() => onSubcategoryChange(subcategory.slug)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {subcategory.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SubcategoryPillButtons;
