import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary-500 text-primary-foreground hover:bg-primary-600 hover:shadow-md focus-visible:ring-primary-500",
        primary:
          "bg-primary-500 text-primary-foreground hover:bg-primary-600 hover:shadow-md focus-visible:ring-primary-500",
        secondary:
          "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-neutral-500",
        success:
          "bg-success-500 text-white hover:bg-success-600 hover:shadow-md focus-visible:ring-success-500",
        warning:
          "bg-warning-500 text-white hover:bg-warning-600 hover:shadow-md focus-visible:ring-warning-500",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive",
        outline:
          "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 focus-visible:ring-neutral-500",
        ghost:
          "bg-transparent hover:bg-neutral-50 text-neutral-700 focus-visible:ring-neutral-500",
        link:
          "text-primary-500 underline-offset-4 hover:underline focus-visible:ring-primary-500",
        premium:
          "bg-gradient-to-r from-gold-400 to-gold-600 text-white hover:from-gold-500 hover:to-gold-700 hover:shadow-lg focus-visible:ring-gold-500",
        luxury:
          "bg-luxury-600 text-white hover:bg-luxury-700 focus-visible:ring-luxury-500 font-semibold",
        glass:
          "bg-white/80 backdrop-blur-sm border border-neutral-200 text-neutral-900 hover:bg-white focus-visible:ring-neutral-500",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-6 py-3 text-base",
        xl: "h-14 px-8 py-4 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button
