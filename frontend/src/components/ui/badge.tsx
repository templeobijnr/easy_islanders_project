import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Legacy default maps to primary style
        default:
          "border-transparent bg-primary-100 text-primary-700 hover:bg-primary-200",

        // Semantic primary
        primary:
          "border-transparent bg-primary-100 text-primary-700 hover:bg-primary-200",

        // Legacy secondary maps to neutral
        secondary:
          "border-transparent bg-neutral-100 text-neutral-700 hover:bg-neutral-200",

        // Semantic neutral
        neutral:
          "border-transparent bg-neutral-100 text-neutral-700 hover:bg-neutral-200",

        // Legacy destructive maps to error style
        destructive:
          "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20",

        // Semantic error
        error:
          "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20",

        // Semantic success
        success:
          "border-transparent bg-success-100 text-success-700 hover:bg-success-200",

        // Semantic warning
        warning:
          "border-transparent bg-warning-100 text-warning-700 hover:bg-warning-200",

        // Premium gradient
        premium:
          "border-transparent bg-gradient-to-r from-gold-100 to-gold-200 text-gold-800 hover:from-gold-200 hover:to-gold-300",

        // Outline / subtle
        outline:
          "border-neutral-300 text-neutral-700 hover:bg-neutral-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
