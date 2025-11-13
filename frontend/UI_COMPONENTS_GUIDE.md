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

## Implementation Checklist

When adding premium polish to a new page or component, follow this checklist:

1. **PageTransition Wrapper**: Wrap the entire page component with `PageTransition` for smooth route transitions.

   ```tsx
   import { PageTransition } from '@/components/ui/animated-wrapper';

   export default function MyPage() {
     return (
       <PageTransition>
         <div className="min-h-screen">
           {/* page content */}
         </div>
       </PageTransition>
     );
   }
   ```

2. **Skeleton Loaders for Async Content**: Show skeleton loaders for all async operations that take >200ms.

   ```tsx
   import { CardSkeleton } from '@/components/ui/skeleton';

   {loading ? (
     <div className={layout.grid3}>
       {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
     </div>
   ) : (
     <DataGrid />
   )}
   ```

3. **StaggerContainer for Lists/Grids**: Use `StaggerContainer` and `StaggerItem` for lists and grids to create cascading entrance effects.

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

4. **Spacing Utilities**: Use spacing utilities from `@/lib/spacing` instead of hardcoded values.

   ```tsx
   import { spacing, layout } from '@/lib/spacing';

   <div className={spacing.pageContainer}>
     <div className={spacing.section}>
       <div className={layout.grid3}>
         {/* content */}
       </div>
     </div>
   </div>
   ```

5. **Semantic Color Tokens**: Use semantic color tokens instead of hardcoded Tailwind colors.

   ```tsx
   // Good
   <div className="bg-primary text-primary-foreground border-border">

   // Avoid
   <div className="bg-blue-500 text-white border-gray-200">
   ```

6. **AnimatedWrapper for Key Sections**: Add `AnimatedWrapper` to important sections for smooth entrance animations.

   ```tsx
   <AnimatedWrapper animation="fadeInUp">
     <Card>
       <CardHeader>
         <CardTitle>Important Section</CardTitle>
       </CardHeader>
     </Card>
   </AnimatedWrapper>
   ```

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

**Best Practice:** Always wrap route components with PageTransition for smooth navigation.

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

### Real-World Examples

**CardSkeleton for Dashboard Cards:**
```tsx
// From MyListings.jsx
{loading ? (
  <div className={layout.grid3}>
    {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
  </div>
) : (
  <ListingsGrid />
)}
```

**ListItemSkeleton for Messages/Threads:**
```tsx
// From Messages.jsx
{loading ? (
  <div className="space-y-2">
    {Array(5).fill(0).map((_, i) => <ListItemSkeleton key={i} />)}
  </div>
) : (
  <ThreadsList />
)}
```

**TableSkeleton for Analytics Data:**
```tsx
// From Analytics.jsx
{loading ? (
  <TableSkeleton rows={5} cols={4} />
) : (
  <AnalyticsTable />
)}
```

### When to Use Each Type

- **CardSkeleton**: For card-based layouts (listings, bookings, requests, profile sections)
- **ListItemSkeleton**: For list items (messages, threads, notifications)
- **TableSkeleton**: For tabular data (analytics, reports)
- **TextSkeleton**: For text-heavy content (descriptions, bios)
- **Skeleton**: For custom shapes (avatars, buttons, icons)

**Best Practice:** Always show skeleton loaders for async operations that take >200ms. This provides immediate visual feedback and improves perceived performance.

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

## Semantic Colors

The app uses a semantic color system for consistent theming across light and dark modes.

### Color Tokens

| Token | Purpose | Example Usage |
|-------|---------|---------------|
| `primary` | Main brand actions | Buttons, links |
| `destructive` | Dangerous actions | Delete buttons |
| `success` | Positive states | Success badges, confirmations |
| `warning` | Caution states | Warning badges, alerts |
| `muted` | Subtle text | Descriptions, placeholders |
| `accent` | Secondary emphasis | Highlights, borders |
| `foreground` | Main text | Headings, body text |
| `background` | Page background | Main containers |
| `card` | Card backgrounds | Card components |
| `border` | Borders | Dividers, inputs |

### Replacing Hardcoded Colors

```tsx
// Before (hardcoded)
<div className="bg-blue-500 text-white border-gray-200">

// After (semantic)
<div className="bg-primary text-primary-foreground border-border">
```

```tsx
// Status badges
<Badge variant="success">Active</Badge>  // Uses success color
<Badge variant="warning">Pending</Badge> // Uses warning color
<Badge variant="destructive">Error</Badge> // Uses destructive color
```

**Best Practice:** Always use semantic color tokens instead of hardcoded Tailwind colors. This ensures consistency across themes and makes it easy to update the color scheme.

## Spacing Utilities

Consistent spacing and alignment helpers from `@/lib/spacing`.

### Available Utilities

**Spacing:**
- `pageContainer`: "px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12"
- `pageContent`: "max-w-7xl mx-auto"
- `section`: "mb-8 sm:mb-12 lg:mb-16"
- `cardPadding`: "p-4 sm:p-6 lg:p-8"
- `gridGap`: "gap-4 sm:gap-6 lg:gap-8"
- `formGap`: "space-y-4 sm:space-y-6"
- `buttonGap`: "gap-2 sm:gap-3"

**Alignment:**
- `center`: "flex items-center justify-center"
- `spaceBetween`: "flex items-center justify-between"

**Layout:**
- `grid2`: "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
- `grid3`: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"

### Examples of Replacing Hardcoded Spacing

```tsx
// Before (hardcoded)
<div className="p-4 mb-6 gap-6">

// After (utilities)
<div className={`${spacing.cardPadding} ${spacing.section} ${spacing.gridGap}`}>
```

**Common Patterns:**

| Hardcoded | Utility |
|-----------|---------|
| `p-4` | `spacing.cardPadding` |
| `gap-6` | `spacing.gridGap` |
| `space-y-4` | `spacing.formGap` |
| `mb-8` | `spacing.section` |
| `px-4 py-6` | `spacing.pageContainer` |

**Best Practice:** Use spacing utilities for consistency across the app. This ensures uniform spacing and makes responsive design easier.

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

### 8. **Use skeleton loaders instead of spinners for better UX**

### 9. **Wrap all route components with PageTransition**

### 10. **Use spacing utilities for consistent layout**

### 11. **Always provide loading states for async operations**

### 12. **Use StaggerContainer for lists and grids**

## Loading States

Document patterns for loading states across the app.

### Button Loading States

```tsx
// From Settings.jsx
<Button disabled={loading} variant="premium">
  {loading ? (
    <>
      <Loader2 className="animate-spin" />
      Saving...
    </>
  ) : (
    'Save Changes'
  )}
</Button>
```

### Form Submission States

```tsx
// From CreateListing.jsx
<Button type="submit" disabled={submitting}>
  {submitting ? (
    <>
      <Loader2 className="animate-spin" />
      Publishing...
    </>
  ) : (
    'Publish Listing'
  )}
</Button>
```

### Data Fetching States

```tsx
// From Profile.jsx
{loading ? (
  <div className="space-y-6">
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </div>
) : (
  <ProfileCards />
)}
```

**Best Practice:** Always provide visual feedback for async operations. Use skeleton loaders for content loading and spinner buttons for actions.

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

### Button Press Animations

Buttons have smooth press animations using `active:scale-[0.98]`:

```tsx
// From button.tsx
<button className="... active:scale-[0.98] transition-transform">
```

### Card Hover Effects

Cards use `whileHover` with scale, y-translation, and glow:

```tsx
// From card.tsx
<motion.div
  whileHover={{ y: -4, boxShadow: '0px 4px 16px rgba(0,0,0,0.15)' }}
>
```

### Input Focus Animations

Inputs have `focus-visible:ring-2` for smooth focus states.

## Animation Performance

Performance considerations for animations.

### Best Practices

- **Use transform/opacity**: Animate `transform` and `opacity` properties for best performance
- **Avoid layout properties**: Don't animate `width`, `height`, `top`, `left` as they cause layout thrashing
- **Use will-change sparingly**: Only use `will-change` for animations that run frequently
- **Prefer CSS animations**: For simple animations, use CSS transitions instead of JavaScript

### Optimized Animations from animations.ts

```tsx
// Good - uses transform and opacity
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Avoid - animates layout properties
// export const badAnimation = {
//   hidden: { width: 0 },
//   visible: { width: '100%' }
// };
```

### Performance Monitoring

Use browser dev tools to monitor frame rate during animations. Aim for 60fps.

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

## Common Patterns

Document common patterns found in the codebase.

### Dashboard Stats Cards with Stagger Animation

```tsx
// From MyListings.jsx
<StaggerContainer>
  {stats.map((stat, index) => (
    <StaggerItem key={stat.id}>
      <Card>
        <CardContent>
          <div className="text-2xl font-bold">{stat.value}</div>
          <p className="text-muted-foreground">{stat.label}</p>
        </CardContent>
      </Card>
    </StaggerItem>
  ))}
</StaggerContainer>
```

### List Pages with Skeleton Loaders and StaggerContainer

```tsx
// From Bookings.jsx
{loading ? (
  <div className={layout.grid3}>
    {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
  </div>
) : (
  <StaggerContainer>
    {bookings.map(booking => (
      <StaggerItem key={booking.id}>
        <BookingCard booking={booking} />
      </StaggerItem>
    ))}
  </StaggerContainer>
)}
```

### Form Pages with Loading States and Validation Feedback

```tsx
// From Profile.jsx
<form onSubmit={handleSubmit}>
  <div className={spacing.formGap}>
    <Input
      value={name}
      onChange={e => setName(e.target.value)}
      placeholder="Full Name"
    />
    {errors.name && (
      <AnimatedWrapper animation="slideInFromTop">
        <p className="text-destructive text-sm">{errors.name}</p>
      </AnimatedWrapper>
    )}
  </div>
  <Button type="submit" disabled={loading}>
    {loading ? <Loader2 className="animate-spin" /> : 'Save'}
  </Button>
</form>
```

### Modal Dialogs with Entrance Animations

```tsx
// From Requests.jsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Request</DialogTitle>
    </DialogHeader>
    {/* Dialog automatically has fade-in, zoom-in, slide-in animations */}
  </DialogContent>
</Dialog>
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
11. **Use skeleton loaders for all async operations >200ms**
12. **Wrap route components with PageTransition for smooth navigation**
13. **Use StaggerContainer for lists/grids to create cascading entrance effects**
14. **Always provide visual feedback for user actions (button press, form submission, etc.)**

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

### Skeleton loaders not showing

Check loading state logic. Ensure the loading state is properly set to `true` during async operations and `false` when complete.

### Animations not smooth

Check for layout thrashing. Use browser dev tools to inspect performance. Ensure animations use `transform` and `opacity` instead of layout properties like `width` or `height`.

### Spacing inconsistent

Use spacing utilities instead of hardcoded values. Import `spacing` from `@/lib/spacing` and use classes like `spacing.cardPadding`.

### Colors don't match design

Use semantic color tokens instead of hardcoded Tailwind colors. Replace `bg-blue-500` with `bg-primary`, etc.

## 📖 Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Happy coding! 🚀** Your UI is now premium, modern, and beautifully animated!