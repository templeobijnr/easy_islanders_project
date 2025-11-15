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
      <div className="flex gap-2 pb-2">
        {/* "All" chip */}
        <button
          onClick={() => onSubcategoryChange(null)}
          className={`
            flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5
            rounded-full text-sm md:text-base font-medium
            transition-all duration-200
            ${
              activeSubcategory === null
                ? 'bg-lime-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
                flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5
                rounded-full text-sm md:text-base font-medium whitespace-nowrap
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-lime-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
