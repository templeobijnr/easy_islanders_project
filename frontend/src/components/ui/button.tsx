import React from 'react'
import { Button as HButton, type ButtonProps as HButtonProps } from '@heroui/react'

type Variant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'premium'
  | 'glass'

type Size = 'sm' | 'default' | 'lg' | 'icon'

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  variant?: Variant
  size?: Size
  className?: string
}

function mapVariant(variant: Variant | undefined): Pick<HButtonProps, 'variant' | 'color'> {
  switch (variant) {
    case 'secondary':
      return { variant: 'solid', color: 'secondary' }
    case 'outline':
      return { variant: 'bordered', color: 'primary' }
    case 'ghost':
      return { variant: 'ghost', color: 'primary' }
    case 'destructive':
      return { variant: 'solid', color: 'danger' }
    case 'link':
      return { variant: 'light', color: 'primary' }
    case 'premium':
    case 'glass':
      return { variant: 'shadow', color: 'primary' }
    case 'default':
    default:
      return { variant: 'solid', color: 'primary' }
  }
}

function mapSize(size: Size | undefined): HButtonProps['size'] {
  switch (size) {
    case 'sm':
      return 'sm'
    case 'lg':
      return 'lg'
    case 'icon':
    case 'default':
    default:
      return 'md'
  }
}

// Minimal class generator used by a few places (e.g., calendar nav buttons)
export function buttonVariants({ variant, size, className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const v = {
    default: 'bg-primary text-white hover:opacity-90',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
    link: 'text-primary underline-offset-4 hover:underline',
    premium: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
  } as Record<Variant, string>
  const s = {
    sm: 'h-9 px-3',
    default: 'h-10 px-4',
    lg: 'h-11 px-6',
    icon: 'h-10 w-10',
  } as Record<Size, string>
  const vk = (variant ?? 'default') as Variant
  const sk = (size ?? 'default') as Size
  return [base, v[vk], s[sk], className].filter(Boolean).join(' ')
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'default', className = '', ...props },
  ref
) {
  const mapped = mapVariant(variant)
  const mappedSize = mapSize(size)
  // Keep className to allow custom styles like "premium"/"glass" embellishments
  return <HButton ref={ref as any} {...mapped} size={mappedSize} className={className} {...(props as any)} />
})

export default Button
