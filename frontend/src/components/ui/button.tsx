import React from 'react'

type Variant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'premium'
  | 'luxury'
  | 'glass'

type Size = 'sm' | 'default' | 'lg' | 'xl' | 'icon'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  className?: string
}

// Minimal class generator used by a few places (e.g., calendar nav buttons)
export function buttonVariants({ variant, size, className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  const base = 'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const v = {
    default: 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white hover:shadow-xl transition-shadow shadow-lg',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg',
    outline: 'border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 shadow-sm',
    ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700',
    link: 'text-primary underline-offset-4 hover:underline',
    premium: 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105',
    luxury: 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105 font-bold',
    glass: 'bg-white/20 backdrop-blur-lg border-2 border-white/30 text-white hover:bg-white/30 shadow-xl',
  } as Record<Variant, string>
  const s = {
    sm: 'h-9 px-3 text-xs',
    default: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 py-3 text-base',
    xl: 'h-14 px-8 py-4 text-lg',
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
  const classes = buttonVariants({ variant, size, className })
  return <button ref={ref} className={classes} {...props} />
})

export default Button
