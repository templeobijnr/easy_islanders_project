/**
 * Premium Card Component
 *
 * Enhanced with:
 * - Larger border radius (rounded-2xl)
 * - Premium shadows (shadow-lg → shadow-xl on hover)
 * - Better border colors (neutral-200)
 * - Smooth transitions
 *
 * For animated cards, wrap with motion.div:
 * <motion.div>
 *   <Card>...</Card>
 * </motion.div>
 *
 * Or use directly:
 * import { motion } from 'framer-motion';
 * <Card as={motion.div} whileHover={{ y: -4 }}>...</Card>
 */

import React from "react";
import { cn } from "../../lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType;
  hover?: boolean;
};

export function Card({
  className = "",
  as: Component = "div",
  hover = true,
  ...props
}: Props) {
  return (
    <Component
      className={cn(
        "rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden",
        "shadow-lg transition-shadow duration-200",
        hover && "hover:shadow-xl",
        className
      )}
      {...props}
    />
  );
}