# Premium shadcn/ui Components

This directory contains premium, production-ready components built with shadcn/ui, Framer Motion, and Tailwind CSS. These components provide a polished, professional look and feel that doesn't look "AI-generated".

## Components

### 1. Animated Modal (`animated-modal.tsx`)

A beautiful, animated modal with smooth transitions and backdrop blur.

**Features:**
- Smooth scale and fade animations
- Backdrop blur effect
- Keyboard support (ESC to close)
- Click outside to close
- Customizable content and footer
- Premium shadow and border styling

**Usage:**
```tsx
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "@/components/ui/shadcn-io/animated-modal";
import { motion } from "framer-motion";

function BookingExample() {
  return (
    <Modal>
      <ModalTrigger className="bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-lg hover:shadow-xl">
        <span className="group-hover/modal-btn:translate-x-40 text-center transition duration-500">
          Book Now
        </span>
        <div className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 text-white z-20">
          ✈️
        </div>
      </ModalTrigger>
      <ModalBody>
        <ModalContent>
          <h4 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            Complete Your Booking
          </h4>
          <p className="text-neutral-600 dark:text-neutral-400">
            Your booking details here...
          </p>
        </ModalContent>
        <ModalFooter className="gap-4">
          <button className="px-4 py-2 bg-neutral-200 text-black rounded-xl text-sm font-medium hover:bg-neutral-300 transition-colors">
            Cancel
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-brand-500 to-cyan-500 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow">
            Confirm Booking
          </button>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}
```

**Design Principles:**
- Uses `rounded-3xl` for premium curved corners
- Backdrop blur with `backdrop-blur-md`
- Smooth spring animations
- Premium shadows with `shadow-2xl`
- Proper z-index layering

---

### 2. Premium Navbar (`navbar-04.tsx`)

A professional navigation bar with smooth animations, mobile support, and premium styling.

**Features:**
- Animated logo with hover effects
- Active state indicators with animated underline
- Mobile responsive with hamburger menu
- Smooth transitions and micro-interactions
- Gradient brand colors
- Notification badges
- Backdrop blur for modern glass effect

**Usage:**
```tsx
import { Navbar04 } from '@/components/ui/shadcn-io/navbar-04';

function App() {
  return (
    <div>
      <Navbar04 />
      {/* Your content */}
    </div>
  );
}
```

**Customization:**
The navbar automatically reads from React Router's location to determine active state. To customize navigation items, edit the `navigation` array in `navbar-04.tsx`:

```tsx
const navigation = [
  { name: "Chat", href: "/", icon: MessageCircle },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, authRequired: true },
  { name: "Create Listing", href: "/create-listing", icon: Plus, businessOnly: true },
];
```

**Design Principles:**
- Uses `bg-white/80 backdrop-blur-xl` for glass morphism
- Gradient logo with `from-brand-500 to-cyan-500`
- Hover scale effects with `whileHover={{ scale: 1.05 }}`
- Active state with animated layout indicator
- Premium spacing and typography

---

### 3. Interactive Bar Chart (`bar-chart-01.tsx`)

A beautiful, interactive bar chart with animations and hover effects.

**Features:**
- Animated bars with stagger effect
- Hover interactions with scale effects
- Shimmer animation on bars
- Interactive legend
- Gradient colors for each category
- Percentage display
- Responsive design

**Usage:**
```tsx
import { ChartBarInteractive } from '@/components/ui/shadcn-io/bar-chart-01';

const chartData = [
  { label: "Real Estate", value: 450, color: "from-blue-500 to-cyan-500" },
  { label: "Services", value: 320, color: "from-purple-500 to-pink-500" },
  { label: "Events", value: 280, color: "from-orange-500 to-red-500" },
  { label: "Marketplace", value: 180, color: "from-green-500 to-emerald-500" },
  { label: "Jobs", value: 150, color: "from-yellow-500 to-amber-500" },
];

function Dashboard() {
  return (
    <ChartBarInteractive
      data={chartData}
      title="Category Performance"
      subtitle="View activity by category"
    />
  );
}
```

**Design Principles:**
- Gradient backgrounds for visual interest
- Animated entrance with stagger
- Shimmer effect for premium feel
- Interactive hover states
- Clean, readable typography
- Proper spacing and padding

---

## Design System

### Typography

We use **Inter** as the primary sans-serif font and **Space Grotesk** as the display font.

```tsx
// Headings - use font-display
<h1 className="font-display text-4xl font-bold">Premium Heading</h1>

// Body text - uses font-sans (Inter) by default
<p className="text-base">Body text here</p>
```

### Colors

**Brand Colors:**
- Primary: `brand-500` (#6CC24A - lime green)
- Gradient: `from-brand-500 to-cyan-500`

**Gradients:**
```tsx
// Premium button
className="bg-gradient-to-r from-brand-500 to-cyan-500"

// Glass effect
className="bg-white/80 backdrop-blur-xl"
```

### Shadows

```tsx
// Soft shadow
className="shadow-soft"

// Medium shadow
className="shadow-softmd"

// Large shadow (for cards and modals)
className="shadow-lg"

// Extra large (for premium elements)
className="shadow-xl"
```

### Border Radius

```tsx
// Small radius
className="rounded-xl"

// Large radius (recommended for cards)
className="rounded-2xl"

// Extra large (for modals)
className="rounded-3xl"

// Pill shape (for buttons)
className="rounded-full"
```

### Animations

**Hover Effects:**
```tsx
// Scale up
whileHover={{ scale: 1.05 }}

// Scale down (for buttons)
whileTap={{ scale: 0.98 }}

// Combination
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Click me
</motion.button>
```

**Entrance Animations:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

## Migration Guide

### Replacing Old Buttons

**Before:**
```tsx
<button className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark">
  Click me
</button>
```

**After (Option 1 - Premium shadcn button):**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="premium" size="lg">
  Click me
</Button>
```

**After (Option 2 - Animated button):**
```tsx
import { motion } from 'framer-motion';

<motion.button
  className="px-6 py-3 bg-gradient-to-r from-brand-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  Click me
</motion.button>
```

### Replacing Old Cards

**Before:**
```tsx
<div className="rounded-lg border border-gray-200 bg-white p-4">
  Content
</div>
```

**After:**
```tsx
import { motion } from 'framer-motion';

<motion.div
  className="rounded-2xl border border-neutral-200 bg-white shadow-lg hover:shadow-xl transition-shadow p-6"
  whileHover={{ y: -4 }}
>
  Content
</motion.div>
```

### Replacing Old Navbar

**Before:**
```tsx
<header className="bg-white border-b sticky top-0">
  {/* Navigation items */}
</header>
```

**After:**
```tsx
import { Navbar04 } from '@/components/ui/shadcn-io/navbar-04';

<Navbar04 />
```

---

## Best Practices

### 1. Always Use Motion for Interactive Elements

```tsx
// Good
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  Click
</motion.button>

// Avoid
<button className="hover:scale-105">
  Click
</button>
```

### 2. Use Gradients for Premium Feel

```tsx
// Premium gradient button
className="bg-gradient-to-r from-brand-500 to-cyan-500"

// Premium gradient text
className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent"
```

### 3. Add Backdrop Blur for Modern Look

```tsx
// Glass morphism navbar
className="bg-white/80 backdrop-blur-xl"

// Modal backdrop
className="bg-black/60 backdrop-blur-md"
```

### 4. Use Proper Spacing

```tsx
// Good spacing
className="px-6 py-3"  // Buttons
className="p-6"        // Cards
className="px-8 py-12" // Modals

// Avoid
className="px-2 py-1"  // Too cramped
```

### 5. Layer Shadows Properly

```tsx
// Card hierarchy
Base card: shadow-lg
Hovered card: shadow-xl
Modal: shadow-2xl
```

---

## Examples in Action

Check these files for complete working examples:
- `/frontend/src/components/examples/AnimatedModalExample.tsx`
- `/frontend/src/components/examples/NavbarExample.tsx`
- `/frontend/src/components/examples/ChartExample.tsx`

---

## Troubleshooting

### Animations Not Working

Make sure `framer-motion` is installed:
```bash
npm install framer-motion
```

### Gradients Not Showing

Ensure your `tailwind.config.js` has the brand colors defined:
```js
colors: {
  brand: {
    500: '#6CC24A',
    // ...
  }
}
```

### Fonts Not Loading

Check that the Google Fonts import is in `index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
```

---

## Support

For questions or issues with these components, refer to:
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
