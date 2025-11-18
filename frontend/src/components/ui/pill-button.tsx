/**
 * PillButton - Rounded pill button with variants
 * HIMS-inspired design with scale hover effects
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Variant styles
    const variants = {
      primary:
        'bg-primary-500 text-primary-foreground hover:bg-primary-600 active:bg-primary-700',
      secondary:
        'bg-transparent border-2 border-primary text-primary hover:bg-primary/5 active:bg-primary/10',
      accent:
        'bg-warning-500 text-warning-foreground hover:bg-warning-600 active:bg-warning-700',
      ghost:
        'bg-transparent text-muted-foreground hover:bg-neutral-100 active:bg-neutral-200',
    };

    // Size styles
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    // Loading spinner
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base styles
          'pill-button',
          'inline-flex items-center justify-center gap-2',
          'font-semibold font-[family:var(--font-body)]',
          'rounded-[var(--radius-lg)]',
          'transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',

          // Variant styles
          variants[variant],

          // Size styles
          sizes[size],

          // Disabled styles
          (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',

          // Hover/active states (already in variants, but ensuring transform)
          'hover:scale-[1.02]',
          'active:scale-[0.98]',

          className
        )}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

PillButton.displayName = 'PillButton';

export { PillButton };
export default PillButton;
