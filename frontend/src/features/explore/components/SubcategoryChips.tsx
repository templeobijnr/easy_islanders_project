/**
 * SubcategoryChips - Filter chips for subcategories
 * Desktop-first, responsive design
 */

import React from 'react';
import { SubCategory } from '../types';

interface SubcategoryChipsProps {
  subcategories: SubCategory[];
  activeSubcategory: string | null;
  onSubcategoryChange: (subcategorySlug: string | null) => void;
  categoryName?: string;
}

const SubcategoryChips: React.FC<SubcategoryChipsProps> = ({
  subcategories,
  activeSubcategory,
  onSubcategoryChange,
  categoryName = 'items',
}) => {
  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 pb-2">
        {/* "All" chip */}
        <button
          onClick={() => onSubcategoryChange(null)}
          className={`
            flex-shrink-0 px-5 md:px-6 py-2.5 md:py-3
            rounded-xl text-sm md:text-base font-semibold
            transition-all duration-300 shadow-lg
            ${
              activeSubcategory === null
                ? 'bg-lime-600 text-white shadow-xl scale-105'
                : 'backdrop-blur-sm bg-white/70 text-slate-700 border border-white/60 hover:bg-white/90 hover:scale-105'
            }
          `}
        >
          All {categoryName}
        </button>

        {/* Subcategory chips */}
        {subcategories.map((subcat) => {
          const isActive = activeSubcategory === subcat.slug;

          return (
            <button
              key={subcat.id}
              onClick={() => onSubcategoryChange(subcat.slug)}
              className={`
                flex-shrink-0 px-5 md:px-6 py-2.5 md:py-3
                rounded-xl text-sm md:text-base font-semibold whitespace-nowrap
                transition-all duration-300 shadow-lg
                ${
                  isActive
                    ? 'bg-lime-600 text-white shadow-xl scale-105'
                    : 'backdrop-blur-sm bg-white/70 text-slate-700 border border-white/60 hover:bg-white/90 hover:scale-105'
                }
              `}
            >
              {subcat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SubcategoryChips;
