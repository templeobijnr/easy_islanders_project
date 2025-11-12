/**
 * Spacing utilities for consistent layout
 * 
 * Usage:
 * import { spacing } from '@/lib/spacing';
 * 
 * <div className={spacing.pageContainer}>
 *   <div className={spacing.section}>...</div>
 * </div>
 */

export const spacing = {
  // Page-level spacing
  pageContainer: "px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12",
  pageContent: "max-w-7xl mx-auto",
  
  // Section spacing
  section: "mb-8 sm:mb-12 lg:mb-16",
  sectionSmall: "mb-4 sm:mb-6 lg:mb-8",
  sectionLarge: "mb-12 sm:mb-16 lg:mb-24",
  
  // Card spacing
  cardPadding: "p-4 sm:p-6 lg:p-8",
  cardGap: "gap-4 sm:gap-6",
  
  // Grid spacing
  gridGap: "gap-4 sm:gap-6 lg:gap-8",
  gridGapSmall: "gap-2 sm:gap-4",
  gridGapLarge: "gap-6 sm:gap-8 lg:gap-12",
  
  // List spacing
  listGap: "space-y-3 sm:space-y-4",
  listItemPadding: "p-3 sm:p-4",
  
  // Form spacing
  formGap: "space-y-4 sm:space-y-6",
  formFieldGap: "space-y-2",
  
  // Button spacing
  buttonGap: "gap-2 sm:gap-3",
  buttonGroupGap: "gap-2 sm:gap-4",
  
  // Text spacing
  textGap: "space-y-2 sm:space-y-3",
  headingMargin: "mb-4 sm:mb-6",
  paragraphMargin: "mb-3 sm:mb-4",
} as const;

/**
 * Alignment utilities
 */
export const alignment = {
  // Flex alignment
  center: "flex items-center justify-center",
  centerVertical: "flex items-center",
  centerHorizontal: "flex justify-center",
  spaceBetween: "flex items-center justify-between",
  spaceAround: "flex items-center justify-around",
  
  // Text alignment
  textCenter: "text-center",
  textLeft: "text-left",
  textRight: "text-right",
  
  // Container alignment
  containerCenter: "mx-auto",
  containerLeft: "mr-auto",
  containerRight: "ml-auto",
} as const;

/**
 * Layout utilities
 */
export const layout = {
  // Container widths
  container: "w-full max-w-7xl mx-auto",
  containerSmall: "w-full max-w-4xl mx-auto",
  containerLarge: "w-full max-w-[1400px] mx-auto",
  
  // Grid layouts
  grid2: "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
  grid3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
  grid4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6",
  
  // Flex layouts
  flexRow: "flex flex-row items-center",
  flexCol: "flex flex-col",
  flexWrap: "flex flex-wrap",
} as const;

