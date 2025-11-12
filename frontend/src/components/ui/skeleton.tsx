import * as React from "react"
import { cn } from "../../lib/utils"

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("animate-pulse rounded-md bg-muted", className)}
    {...props}
  />
))
Skeleton.displayName = "Skeleton"

/**
 * Skeleton loader for cards
 */
const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("rounded-2xl border bg-card p-6", className)}>
    <Skeleton className="h-48 w-full mb-4" />
    <Skeleton className="h-6 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <div className="flex gap-2">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-10" />
    </div>
  </div>
)

/**
 * Skeleton loader for list items
 */
const ListItemSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex items-center gap-4 p-4", className)}>
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
)

/**
 * Skeleton loader for text lines
 */
const TextSkeleton: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "h-4",
          i === lines - 1 ? "w-3/4" : "w-full"
        )}
      />
    ))}
  </div>
)

/**
 * Skeleton loader for table rows
 */
const TableSkeleton: React.FC<{
  rows?: number;
  cols?: number;
  className?: string;
}> = ({ rows = 5, cols = 4, className }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton
            key={j}
            className={cn(
              "h-10 flex-1",
              j === 0 && "w-20"
            )}
          />
        ))}
      </div>
    ))}
  </div>
)

export {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  TextSkeleton,
  TableSkeleton,
}

