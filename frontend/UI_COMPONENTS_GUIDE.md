# Premium UI Components Guide

## 🎨 Overview

We've integrated **shadcn/ui** components with **Framer Motion** animations to create a beautiful, modern, and premium user interface. All components are built with TypeScript, fully typed, and follow best practices.

**✨ Latest Updates:**
- ✅ Smooth page transitions with `PageTransition` component
- ✅ Enhanced button press animations with framer-motion
- ✅ Card hover glow effects
- ✅ Skeleton loaders for async content
- ✅ Enhanced modal and dropdown entrance animations
- ✅ Consistent spacing and alignment utilities
- ✅ Theme color and typography audit

## 📦 What's New

### 1. **shadcn/ui Components**
Beautiful, accessible components built on Radix UI primitives:
- ✅ Button (7 variants including premium & glass)
- ✅ Card (with header, content, footer)
- ✅ Badge (7 variants including animated premium)
- ✅ Input (with focus rings and transitions)
- ✅ Dialog (modal with backdrop blur)
- ✅ Tooltip (smooth animations)
- ✅ Avatar (with fallback and hover effects)

### 2. **Animation Library**
Pre-built animation variants for Framer Motion:
- Fade animations (in, up, down, left, right)
- Scale animations (with bounce)
- Slide animations (from all directions)
- Stagger animations (for lists)
- Card hover effects (with glow)
- Page transitions
- Special effects (shimmer, float, rotate)

### 3. **Helper Components**
Easy-to-use wrapper components:
- `AnimatedWrapper` - Add animations with one line
- `PageTransition` - Smooth page transitions for route changes
- `StaggerContainer` & `StaggerItem` - Animate lists easily
- `AnimatedCard` - Cards with hover effects

### 4. **Skeleton Loaders**
Loading state components for async content:
- `Skeleton` - Base skeleton component
- `CardSkeleton` - Skeleton for card layouts
- `ListItemSkeleton` - Skeleton for list items
- `TextSkeleton` - Skeleton for text content
- `TableSkeleton` - Skeleton for table layouts

### 5. **Spacing & Layout Utilities**
Consistent spacing and alignment helpers:
- `spacing` - Page, section, card, grid, and form spacing
- `alignment` - Flex and text alignment utilities
- `layout` - Container widths and grid layouts

## 🚀 Quick Start

### Using Buttons

```tsx
import { Button } from '@/components/ui/button';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="premium">Premium</Button>
<Button variant="glass">Glass Effect</Button>
<Button variant="outline">Outline</Button>

// With sizes
<Button size="lg">Large</Button>
<Button size="sm">Small</Button>
<Button size="icon"><HeartIcon /></Button>

// With icons
<Button>
  <Sparkles className="w-4 h-4 mr-2" />
  Premium Feature
</Button>
```

### Using Cards

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    Your content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Using Badges

```tsx
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="premium">Premium ✨</Badge>
```

### Using Dialogs

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text
      </DialogDescription>
    </DialogHeader>
    <div>Your content here</div>
  </DialogContent>
</Dialog>
```

### Using Tooltips

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Helpful tooltip text</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## 🎬 Adding Animations

### Method 1: Using AnimatedWrapper

The easiest way to add animations:

```tsx
import { AnimatedWrapper } from '@/components/ui/animated-wrapper';

<AnimatedWrapper animation="fadeInUp">
  <div>This content will fade in from bottom</div>
</AnimatedWrapper>

// Available animations:
// fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight
// scaleIn, scaleInBounce
// slideInFromLeft, slideInFromRight, slideInFromTop, slideInFromBottom
// glassCardIn, float, rotate, shimmer
```

### Method 1.5: Using PageTransition

For smooth page transitions when navigating between routes:

```tsx
import { PageTransition } from '@/components/ui/animated-wrapper';

// In your route configuration
<Route 
  path="/dashboard" 
  element={
    <PageTransition>
      <Dashboard />
    </PageTransition>
  } 
/>
```

The `PageTransition` component automatically animates when the route changes, providing smooth fade and slide transitions.

### Method 2: Using Stagger Animations (for Lists)

Perfect for animating lists of items:

```tsx
import { StaggerContainer, StaggerItem } from '@/components/ui/animated-wrapper';

<StaggerContainer>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card>{item.content}</Card>
    </StaggerItem>
  ))}
</StaggerContainer>
```

### Method 3: Using AnimatedCard

For cards with hover effects:

```tsx
import { AnimatedCard } from '@/components/ui/animated-wrapper';

<AnimatedCard glow>
  <Card>
    Content with beautiful hover glow effect
  </Card>
</AnimatedCard>
```

### Method 4: Direct Framer Motion

For custom animations:

```tsx
import { motion } from 'framer-motion';
import * as animations from '@/lib/animations';

<motion.div
  variants={animations.fadeInUp}
  initial="hidden"
  animate="visible"
>
  Custom animated content
</motion.div>
```

## 💀 Skeleton Loaders

Use skeleton loaders to show loading states for async content:

```tsx
import { Skeleton, CardSkeleton, ListItemSkeleton, TextSkeleton } from '@/components/ui/skeleton';

// Basic skeleton
<Skeleton className="h-4 w-3/4" />

// Card skeleton
<CardSkeleton />

// List item skeleton
<ListItemSkeleton />

// Text skeleton (3 lines by default)
<TextSkeleton lines={4} />

// Table skeleton
<TableSkeleton rows={5} cols={4} />
```

**Example Usage:**
```tsx
{loading ? (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {items.map((item) => (
      <Card key={item.id}>{item.content}</Card>
    ))}
  </div>
)}
```

## 🎨 Theming

### Brand Colors

Your lime green brand color (#6CC24A) is integrated throughout:

```tsx
// In Tailwind classes
<div className="bg-brand-500 text-white">
<div className="border-brand-300">
<div className="text-brand-600">

// Brand scale: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900
```

### Dark Mode Support

All components support dark mode automatically:

```tsx
// Toggle dark mode by adding 'dark' class to html element
document.documentElement.classList.add('dark');
document.documentElement.classList.remove('dark');
```

### Custom Animations

Add custom animations in `tailwind.config.js`:

```js
animation: {
  'my-custom': 'my-custom 1s ease-in-out infinite',
}
keyframes: {
  'my-custom': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)' },
  }
}
```

## 📱 Responsive Design

All components are mobile-first and responsive:

```tsx
// Responsive sizing
<Button size="sm" className="md:h-11 lg:h-12">
  Responsive Button
</Button>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {cards.map(card => <Card key={card.id}>{card.content}</Card>)}
</div>
```

## 🎯 Best Practices

### 1. **Use Semantic Variants**

```tsx
// Good
<Button variant="destructive">Delete</Button>
<Badge variant="success">Active</Badge>

// Avoid
<Button className="bg-red-500">Delete</Button>
```

### 1.5. **Use Consistent Spacing**

```tsx
import { spacing, alignment, layout } from '@/lib/spacing';

// Good - consistent page spacing
<div className={spacing.pageContainer}>
  <div className={spacing.section}>
    <h1 className={spacing.headingMargin}>Title</h1>
    <div className={layout.grid3}>
      {items.map(item => <Card key={item.id} />)}
    </div>
  </div>
</div>

// Avoid - inconsistent spacing
<div className="p-4">
  <div className="mb-8">
    <h1 className="mb-6">Title</h1>
    <div className="grid grid-cols-3 gap-4">
      {items.map(item => <Card key={item.id} />)}
    </div>
  </div>
</div>
```

### 2. **Wrap Tooltips with TooltipProvider**

```tsx
// Good - Provider at app level
<TooltipProvider>
  <App />
</TooltipProvider>

// Or per component
<TooltipProvider>
  <Tooltip>...</Tooltip>
</TooltipProvider>
```

### 3. **Use AnimatedWrapper for Simple Animations**

```tsx
// Good - simple and declarative
<AnimatedWrapper animation="fadeInUp">
  <Card />
</AnimatedWrapper>

// Avoid - overly complex
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  <Card />
</motion.div>
```

### 4. **Leverage Stagger for Lists**

```tsx
// Good - smooth stagger animation
<StaggerContainer>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <ListItem {...item} />
    </StaggerItem>
  ))}
</StaggerContainer>
```

### 5. **Use Card Hover Effects**

```tsx
// Good - card with hover glow
<Card hoverGlow>
  <CardContent>Premium content</CardContent>
</Card>

// Good - card without hover (for static content)
<Card disableHover>
  <CardContent>Static content</CardContent>
</Card>
```

### 6. **Show Loading States**

```tsx
// Good - skeleton loader while loading
{loading ? (
  <CardSkeleton />
) : (
  <Card>
    <CardContent>{data.content}</CardContent>
  </Card>
)}

// Avoid - blank screen or spinner only
{loading && <Spinner />}
{!loading && <Card>...</Card>}
```

### 7. **Wrap Pages with PageTransition**

```tsx
// Good - smooth page transitions
<Routes>
  <Route 
    path="/dashboard" 
    element={
      <PageTransition>
        <Dashboard />
      </PageTransition>
    } 
  />
</Routes>
```

## 🔧 Configuration Files

### Key Files

- `components.json` - shadcn/ui configuration
- `src/lib/utils.ts` - cn() utility for className merging
- `src/lib/animations.ts` - Framer Motion animation variants
- `src/lib/spacing.ts` - Spacing, alignment, and layout utilities
- `src/components/ui/*` - UI component library
- `tailwind.config.js` - Extended with new colors and animations
- `src/index.css` - CSS variables for theming

## 🎨 Micro-Interactions

### Button Press Animations

All buttons now have smooth press animations using framer-motion:

```tsx
// Premium buttons have enhanced hover scale
<Button variant="premium">Premium Button</Button>

// All buttons have press animation (scale down on tap)
<Button>Regular Button</Button>
```

### Card Hover Effects

Cards have smooth hover effects with optional glow:

```tsx
// Standard hover (lift + shadow)
<Card>
  <CardContent>Hover me</CardContent>
</Card>

// Premium hover with brand glow
<Card hoverGlow>
  <CardContent>Premium hover</CardContent>
</Card>
```

### Modal & Dropdown Animations

Modals and dropdowns have enhanced entrance animations:

```tsx
// Dialog automatically animates in/out
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    {/* Smooth fade + scale + slide animation */}
  </DialogContent>
</Dialog>

// Dropdown menu with backdrop blur
<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* Smooth entrance animation */}
  </DropdownMenuContent>
</DropdownMenu>
```

## 📚 Examples

### Real Estate Card (Complete Example)

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard } from '@/components/ui/animated-wrapper';
import { MapPin, Heart } from 'lucide-react';

function PropertyCard({ property }) {
  return (
    <AnimatedCard glow>
      <Card>
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>{property.title}</CardTitle>
            <Badge variant="premium">{property.price}</Badge>
          </div>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {property.location}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="premium" className="flex-1">
              View Details
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}
```

## 🎨 View the Showcase

Check out `/pages/UIShowcase.tsx` for a complete demonstration of all components and animations in action!

To view it:
1. Start the dev server: `npm start`
2. Navigate to the UIShowcase page
3. See all components with live examples

## 💡 Tips

1. **Performance**: AnimatedWrapper uses optimized animations by default
2. **Accessibility**: All components are built on Radix UI (fully accessible)
3. **TypeScript**: Full type safety with IntelliSense support
4. **Customization**: Use `className` prop to extend any component
5. **Composition**: Components are designed to work together seamlessly
6. **Spacing**: Always use spacing utilities for consistency
7. **Loading States**: Use skeleton loaders instead of spinners for better UX
8. **Page Transitions**: Wrap all route components with `PageTransition` for smooth navigation
9. **Theme Colors**: Use semantic color tokens (primary, destructive, etc.) instead of hardcoded colors
10. **Typography**: Use text utility classes (text-heading-1, text-body, etc.) for consistent typography

## 🐛 Troubleshooting

### Import errors

Make sure TypeScript path aliases are configured:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

### Animation not working

1. Check that `framer-motion` is installed
2. Ensure the component is wrapped with `AnimatedWrapper` or using `motion.*`
3. Verify `initial` and `animate` props are set

### Styling issues

1. Check that Tailwind CSS is processing the files
2. Clear cache: `rm -rf node_modules/.cache`
3. Restart dev server

## 📖 Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Happy coding! 🚀** Your UI is now premium, modern, and beautifully animated!
