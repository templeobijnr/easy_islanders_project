# Hims.com Design System Specifications

## Core Color Palette

### Primary Colors
- **Mine Shaft**: `#333333` - Deep gray for trust and modern authority
- **White**: `#FFFFFF` - Clean, clinical contrast

### Subdued Pastels (Supporting Colors)
- **Blue**: Soft, approachable blue tones
- **Coral**: Warm coral accents
- **Orange**: Muted orange highlights

### Lime Emerald Theme Adaptation
For our implementation, we'll adapt Hims' minimalist approach with lime emerald:
- **Primary Lime**: `#32CD32` - Vibrant lime for CTAs and accents
- **Emerald Dark**: `#2E8B57` - Deep emerald for text/headers
- **Light Emerald**: `#F0FFF0` - Subtle background tones
- **Neutral Gray**: `#F5F5F5` - Clean backgrounds
- **Text Dark**: `#2D3748` - High contrast text

## Typography System

### Font Philosophy
- Simple, lowercase typography
- Clean, sans-serif fonts
- Medical-professional appearance
- High readability and accessibility

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Typography Scale
- **Headings**: Bold weights, clean hierarchy
- **Body Text**: Regular weight, optimal line height (1.5x)
- **CTAs**: Bold, direct, uppercase for buttons
- **Captions**: Smaller sizes for secondary information

### Text Styling
- Extensive use of lowercase text
- Minimal, poignant text content
- Clear visual hierarchy through size and weight
- High contrast for accessibility

## UI Components

### Buttons
- **Primary CTAs**: Clean, bold black boxes
- **Secondary CTAs**: Subtle borders or ghost buttons
- **Text**: Direct, engaging copy
- **Placement**: Overlaid on images or in prominent positions

### Cards & Containers
- Clean, minimal borders
- Subtle shadows for depth
- Generous white space
- Medical-professional aesthetic

### Navigation
- Minimal navigation tools
- Four main options: "Shop", "Learn", "Cart", "Login"
- Slide-in menus for categories
- Single words or minimal phrases

### Forms & Inputs
- Clean, simple input fields
- Subtle focus states
- Clear labels and validation
- Accessible contrast ratios

## Layout Principles

### Spacing System
- Extensive negative space
- Generous padding and margins
- Clean, uncluttered layouts
- Breathing room between elements

### Visual Hierarchy
- Bold images with minimal text
- Strong vertical layouts
- Clear CTAs that demand action
- Streamlined user flow

### Responsive Design
- Fluid, adaptive layouts
- Consistent experience across devices
- Touch-friendly interactions
- Accessible on all screen sizes

## Design Philosophy

### Brand Identity
- Modern, millennial-focused
- Medical-professional credibility
- Approachable healthcare experience
- Trust-building through design

### User Experience
- Simple, streamlined processes
- Clear path from discovery to purchase
- Minimal cognitive load
- Confidence-building interactions

### Visual Style
- Minimalist aesthetic
- Subdued, sophisticated colors
- Clean, professional appearance
- Youthful yet trustworthy

## Implementation Guidelines

### CSS Variables
```css
:root {
  /* Colors */
  --color-primary: #32CD32;
  --color-primary-dark: #2E8B57;
  --color-background: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-text: #2D3748;
  --color-text-secondary: #718096;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
}
```

### Component Classes
```css
/* Button Styles */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 24px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Card Styles */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

/* Typography Classes */
.text-heading {
  font-family: var(--font-family);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.text-body {
  font-family: var(--font-family);
  font-weight: 400;
  color: var(--color-text);
  line-height: var(--line-height-base);
}
```

## Quality Assurance Checklist

### Visual Consistency
- [ ] All colors match specified hex values
- [ ] Typography follows established hierarchy
- [ ] Spacing system is consistent
- [ ] Components have uniform styling

### Accessibility
- [ ] Color contrast ratios meet WCAG 2.1 AA standards
- [ ] Text is readable at all sizes
- [ ] Interactive elements have focus states
- [ ] Screen reader compatibility verified

### Responsive Design
- [ ] Layouts adapt to all screen sizes
- [ ] Touch targets are appropriately sized
- [ ] Text remains readable on mobile
- [ ] Navigation is accessible on all devices

### Performance
- [ ] CSS is optimized and minified
- [ ] Font loading is optimized
- [ ] Images are properly sized and compressed
- [ ] Animations are smooth and performant