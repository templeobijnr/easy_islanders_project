# ExplorePage Premium Build-Out Plan

## Executive Summary

Transform ExplorePage.tsx from a basic category browser into a premium, fully functional marketplace that rivals Airbnb, Etsy, and TaskRabbit. This plan details the architecture, components, APIs, user flows, and phased implementation to create an exceptional multi-domain discovery and booking experience.

---

## Table of Contents

1. [Category Structure & Navigation](#category-structure--navigation)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture & Design System](#architecture--design-system)
4. [Component Breakdown](#component-breakdown)
5. [API Specifications](#api-specifications)
6. [User Flows & Wireframes](#user-flows--wireframes)
7. [Advanced Features Implementation](#advanced-features-implementation)
8. [Performance & Optimization](#performance--optimization)
9. [Testing Strategy](#testing-strategy)
10. [Phased Implementation Roadmap](#phased-implementation-roadmap)
11. [Success Metrics & KPIs](#success-metrics--kpis)

---

## Category Structure & Navigation

### Main Category Buttons (Hero Section)
The Explore Page displays **9 main category buttons** (similar to the Hotels, Car Rentals, Restaurants, Beaches buttons in EasyIslanders.jsx), each with their own subcategory buttons:

#### 1. **Real Estate** (Properties/Accommodation)
- **Icon:** `home` | **Color:** `#FF6B6B`
- **Subcategory Buttons:**
  - House
  - Apartment
  - Villa
  - Bungalow
  - Townhouse
  - Penthouse
  - Hotel/Resort
  - Office/Commercial
  - Land/Plot

#### 2. **Vehicles** (Cars)
- **Icon:** `car` | **Color:** `#4ECDC4`
- **Subcategory Buttons:**
  - Car
  - Motorcycle/Scooter
  - Truck/Commercial
  - Bus/Coach
  - Bicycle
  - Electric Scooter
  - Boat/Yacht
  - RV/Campervan

#### 3. **Electronics**
- **Icon:** `smartphone` | **Color:** `#8B5CF6`
- **Subcategory Buttons:**
  - Mobile Phones
  - Computers/Laptops
  - Tablets
  - Gaming Consoles
  - Cameras
  - Audio Equipment
  - TVs
  - Printers/Scanners
  - Accessories

#### 4. **Household Items**
- **Icon:** `home` | **Color:** `#F59E0B`
- **Subcategory Buttons:**
  - Kitchen Appliances
  - Refrigerators
  - Washing Machines
  - Furniture - Bedroom
  - Furniture - Living Room
  - Dining Sets
  - Bedding
  - Lighting
  - Decor & Accessories

#### 5. **Products** (Marketplace)
- **Icon:** `shopping-bag` | **Color:** `#14B8A6`
- **Subcategory Buttons:**
  - Books
  - Clothing & Fashion
  - Shoes & Footwear
  - Sports Equipment
  - Toys & Games
  - Beauty & Personal Care
  - Pet Supplies
  - Tools & Hardware

#### 6. **Events**
- **Icon:** `calendar` | **Color:** `#F38181`
- **Subcategory Buttons:**
  - Conference/Workshop
  - Party/Social
  - Concert/Music
  - Sports Event
  - Art/Creative Workshop
  - Fitness Class
  - Wellness/Spa
  - Educational Course
  - Networking Event
  - Festival/Fair

#### 7. **Activities**
- **Icon:** `activity` | **Color:** `#F6A192`
- **Subcategory Buttons:**
  - Fitness & Wellness
  - Dance Classes
  - Yoga & Meditation
  - Swimming
  - Martial Arts
  - Sports Training
  - Art & Crafts
  - Music Lessons
  - Language Classes
  - Cooking Classes
  - Photography Workshop
  - Sports Recreation
  - Outdoor Adventures
  - Gaming & Esports
  - Hobby Clubs
  - Personal Training
  - Pilates
  - CrossFit
  - Boxing/Kickboxing
  - Corporate Wellness
  - Spa & Relaxation
  - Workshop/Seminar
  - Kids Activities
  - Team Building

#### 8. **Services**
- **Icon:** `briefcase` | **Color:** `#AA96DA`
- **Subcategory Buttons:**
  - Home Services
  - Plumbing
  - Electrical
  - Carpentry/Handyman
  - Cleaning Services
  - Painting & Decoration
  - HVAC Services
  - Pest Control
  - Car Wash & Detailing
  - Auto Repair
  - Legal Services
  - Accounting/Tax
  - IT Support
  - Tutoring/Education
  - Photography Services
  - Videography
  - Web Design/Development
  - Graphic Design
  - Translation Services
  - Fitness Coaching
  - Nutritionist/Dietitian
  - Mental Health Counseling
  - Beauty Services
  - Massage Therapy
  - Veterinary Services
  - Event Planning
  - Interior Design
  - Landscaping/Gardening

#### 9. **Appointments**
- **Icon:** `calendar` | **Color:** `#FECDC3`
- **Subcategory Buttons:**
  - Hair Services
  - Dental
  - Medical Checkup
  - Haircut/Beard Trim
  - Manicure/Pedicure
  - Massage
  - Spa/Facial
  - Eye Exam
  - Veterinary Checkup
  - Therapy/Counseling
  - Physical Therapy
  - Tattoo Appointment
  - Piercing Appointment
  - Fitness Consultation
  - Car Service Appointment

### Navigation Flow
1. **Hero Section:** Display 9 main category buttons (large, prominent, with icons)
2. **Category Page:** When a category is clicked, show:
   - Category header with description
   - Subcategory buttons (chips/pills) below the header
   - Listings filtered by selected category/subcategory
   - Advanced filters sidebar (category-specific)
3. **Subcategory Selection:** Clicking a subcategory button filters listings to that subcategory

### Implementation Notes
- All category and subcategory data comes from `listings/management/commands/seed_categories.py`
- Categories are fetched via `/api/listings/categories/` endpoint
- Subcategories are nested within each category object
- Each category has its own color scheme and icon
- Subcategory buttons should be styled as chips/pills with hover states
- Active subcategory should be highlighted with the category's color

---

## Current State Analysis

### ✅ What Exists:
- **Category Navigation:** Tabs for categories, chips for subcategories
- **Listing Display:** Grid view with cards showing title, price, location
- **Featured Spotlight:** Carousel for featured listings
- **Horizontal Lanes:** Themed listing collections (New, Popular, etc.)
- **Chat Integration:** Clicking listing sends inquiry to agent
- **Basic Filtering:** Category/subcategory selection
- **Design System:** Glass morphism with lime-emerald-sky gradient theme

### ❌ What's Missing:
- **Detail Views:** No modal/page for full listing information
- **Booking Flow:** No calendar, payment, or transaction processing
- **Advanced Filters:** No price range, location radius, ratings, availability
- **Maps:** No geographic visualization
- **Search:** No global search or autocomplete
- **Personalization:** No recommendations or user preferences
- **Reviews/Ratings:** No social proof or user-generated content
- **Real-time Updates:** No live availability or notifications
- **Mobile Optimization:** Limited responsive features

### 🎯 Gap Analysis:

| Feature | Current | Target | Priority |
|---------|---------|--------|----------|
| Detail Views | None | Full modal/page | **Critical** |
| Booking Flow | Chat only | Integrated checkout | **Critical** |
| Search & Filters | Basic | Advanced | **High** |
| Maps | None | Interactive with pins | **High** |
| Personalization | None | AI recommendations | Medium |
| Reviews/Ratings | None | Full review system | Medium |
| Real-time Updates | None | Live availability | Medium |
| Performance | Good | Excellent | **High** |

---

## Architecture & Design System

### Information Architecture

```
ExplorePage
│
├── Hero Section
│   ├── Search Bar (Global)
│   ├── Quick Filters (Price, Location, Availability)
│   └── Main Category Buttons Grid (9 categories)
│       ├── Real Estate (Properties)
│       ├── Vehicles (Cars)
│       ├── Electronics
│       ├── Household Items
│       ├── Products (Marketplace)
│       ├── Events
│       ├── Activities
│       ├── Services
│       └── Appointments
│
├── Category Page (when category selected)
│   ├── Category Header
│   │   ├── Category Icon & Name
│   │   ├── Category Description
│   │   └── Back to All Categories Button
│   │
│   ├── Subcategory Buttons Row
│   │   └── Scrollable chips/pills for all subcategories
│   │       (e.g., for Real Estate: House, Apartment, Villa, etc.)
│   │
│   ├── Advanced Filters Sidebar
│   │   ├── Price Range Slider
│   │   ├── Location Selector (with map)
│   │   ├── Rating Filter
│   │   ├── Availability Calendar
│   │   ├── Amenities/Features Checkboxes
│   │   └── Dynamic Category-Specific Filters
│   │       (e.g., Bedrooms, Bathrooms for Real Estate)
│   │
│   ├── View Controls
│   │   ├── View Toggle (Grid / List / Map)
│   │   └── Sort Dropdown (Price, Date, Rating, Distance)
│   │
│   └── Listing Display
│       ├── Grid View (Cards)
│       ├── List View (Detailed rows)
│       └── Map View (Pins + Sidebar)
│
├── Discovery Section (Homepage only)
│   ├── Featured Spotlight Carousel
│   ├── Personalized Recommendations
│   └── Trending Now
│
├── Listing Detail Modal/Page
│   ├── Image Gallery (Lightbox)
│   ├── Listing Info (Title, Price, Location, Rating)
│   ├── Description & Amenities
│   ├── Reviews Section
│   ├── Host/Seller Profile
│   ├── Availability Calendar
│   ├── Booking Form
│   │   ├── Date/Time Selection
│   │   ├── Guest/Quantity Input
│   │   ├── Add-ons/Extras
│   │   └── Price Breakdown
│   ├── Similar Listings
│   └── Actions (Save, Share, Report, Contact)
│
├── Booking Flow (Multi-step)
│   ├── Step 1: Selection Confirmation
│   ├── Step 2: Guest Details
│   ├── Step 3: Payment Method
│   ├── Step 4: Review & Confirm
│   └── Step 5: Confirmation & Receipt
│
└── Trust & Support Section
    ├── Verification Badges
    ├── Secure Payment Icons
    └── Help/FAQ Quick Links
```

### Design System Specification

#### Color Palette
```typescript
const DESIGN_TOKENS = {
  // Primary (existing)
  primary: {
    lime: '#6CC24A',      // lime-600
    emerald: '#059669',   // emerald-600
    sky: '#0ea5e9',       // sky-500
  },

  // Gradients
  gradients: {
    hero: 'from-lime-200 via-emerald-200 to-sky-200',
    card: 'from-lime-100/80 to-emerald-100/80',
    button: 'from-lime-500 to-emerald-500',
    accent: 'from-sky-400 to-emerald-400',
  },

  // Semantic colors
  semantic: {
    success: '#10b981',   // emerald-500
    warning: '#f59e0b',   // amber-500
    error: '#ef4444',     // red-500
    info: '#3b82f6',      // blue-500
  },

  // Category colors
  category: {
    realEstate: '#6CC24A',   // lime
    services: '#0ea5e9',     // sky
    vehicles: '#8b5cf6',     // violet
    restaurants: '#f97316',  // orange
    events: '#ec4899',       // pink
    products: '#14b8a6',     // teal
  },

  // Glass morphism
  glass: {
    bg: 'bg-white/60 backdrop-blur-md',
    border: 'border border-white/40',
    shadow: 'shadow-xl shadow-lime-600/10',
  }
};
```

#### Component Patterns
```typescript
// Card Pattern
const CARD_STYLES = {
  base: 'rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300',
  hover: 'hover:scale-[1.02] hover:border-lime-400/60',
  active: 'ring-2 ring-lime-600 ring-offset-2',
};

// Button Pattern
const BUTTON_STYLES = {
  primary: 'bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-white rounded-xl px-6 py-3 font-semibold shadow-lg transition-all',
  secondary: 'bg-white/80 backdrop-blur-sm border-2 border-lime-600 text-lime-700 hover:bg-lime-50 rounded-xl px-6 py-3 font-semibold transition-all',
  ghost: 'bg-transparent hover:bg-lime-100/60 text-lime-700 rounded-xl px-4 py-2 transition-all',
};

// Input Pattern
const INPUT_STYLES = {
  base: 'w-full px-4 py-3 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-300 focus:border-lime-600 focus:ring-2 focus:ring-lime-600/20 transition-all',
  search: 'w-full px-12 py-4 rounded-full bg-white/95 backdrop-blur-md border-2 border-white/60 focus:border-lime-600 shadow-lg',
};
```

### Responsive Breakpoints
```typescript
const BREAKPOINTS = {
  mobile: '0-640px',      // Single column, stacked filters
  tablet: '641-1024px',   // 2-column grid, slide-out filters
  desktop: '1025-1440px', // 3-column grid, sidebar filters
  wide: '1441px+',        // 4-column grid, enhanced sidebar
};
```

---

## Component Breakdown

### 1. Main Category Buttons Grid

#### `CategoryButtonsGrid.tsx` (NEW/ENHANCED)
```typescript
/**
 * Hero section displaying 9 main category buttons
 * Similar to Hotels, Car Rentals, Restaurants, Beaches buttons in EasyIslanders.jsx
 */
interface CategoryButtonsGridProps {
  categories: Category[];
  onCategorySelect: (categorySlug: string) => void;
  loading?: boolean;
}

// Features:
// - 9 large, prominent category buttons
// - Each button shows: icon, name, description
// - Hover effects with category-specific colors
// - Responsive grid (3x3 on desktop, 2x2 on tablet, 1x1 on mobile)
// - Smooth animations and transitions
```

**Implementation Snippet:**
```typescript
import { Home, Car, Smartphone, ShoppingBag, Calendar, Activity, Briefcase } from 'lucide-react';
import { Category } from '@/types/category';

const CATEGORY_ICONS = {
  'real-estate': Home,
  'vehicles': Car,
  'electronics': Smartphone,
  'household-items': Home,
  'products': ShoppingBag,
  'events': Calendar,
  'activities': Activity,
  'services': Briefcase,
  'appointments': Calendar,
};

export const CategoryButtonsGrid: React.FC<CategoryButtonsGridProps> = ({
  categories,
  onCategorySelect,
  loading = false,
}) => {
  if (loading) {
    return <CategoryButtonsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.slug] || Home;
        const categoryColor = category.color || '#6CC24A';

        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.slug)}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-white/60 p-6 md:p-8 hover:border-lime-400/60 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            style={{
              '--category-color': categoryColor,
            } as React.CSSProperties}
          >
            {/* Background gradient on hover */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              style={{ background: `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}40)` }}
            />

            <div className="relative flex flex-col items-center text-center space-y-4">
              {/* Icon */}
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${categoryColor}15` }}
              >
                <Icon className="w-8 h-8 md:w-10 md:h-10" style={{ color: categoryColor }} />
              </div>

              {/* Name */}
              <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-slate-950">
                {category.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-600 line-clamp-2">
                {category.description}
              </p>

              {/* Subcategory count badge */}
              {category.subcategories && category.subcategories.length > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {category.subcategories.length} types
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
```

### 2. Subcategory Buttons Row

#### `SubcategoryButtonsRow.tsx` (NEW/ENHANCED)
```typescript
/**
 * Horizontal scrollable row of subcategory buttons/chips
 * Displayed below category header when a category is selected
 */
interface SubcategoryButtonsRowProps {
  subcategories: SubCategory[];
  activeSubcategory: string | null;
  onSubcategorySelect: (subcategorySlug: string | null) => void;
  categoryColor?: string;
}

// Features:
// - Horizontal scrollable row
// - Active subcategory highlighted with category color
// - "All" button to show all subcategories
// - Smooth scrolling
// - Responsive sizing
```

**Implementation Snippet:**
```typescript
import { ChevronRight } from 'lucide-react';
import { SubCategory } from '@/types/category';

export const SubcategoryButtonsRow: React.FC<SubcategoryButtonsRowProps> = ({
  subcategories,
  activeSubcategory,
  onSubcategorySelect,
  categoryColor = '#6CC24A',
}) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide pb-2">
      <div className="flex gap-3 min-w-max">
        {/* "All" button */}
        <button
          onClick={() => onSubcategorySelect(null)}
          className={`
            flex-shrink-0 px-5 py-2.5 rounded-full font-semibold text-sm
            transition-all duration-300 whitespace-nowrap
            ${
              activeSubcategory === null
                ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-white shadow-lg scale-105'
                : 'bg-white/80 backdrop-blur-sm border border-white/60 text-slate-700 hover:bg-white/90 hover:scale-105'
            }
          `}
        >
          All {subcategories.length > 0 ? `(${subcategories.length})` : ''}
        </button>

        {/* Subcategory buttons */}
        {subcategories.map((subcategory) => {
          const isActive = activeSubcategory === subcategory.slug;

          return (
            <button
              key={subcategory.id}
              onClick={() => onSubcategorySelect(subcategory.slug)}
              className={`
                flex-shrink-0 px-5 py-2.5 rounded-full font-semibold text-sm
                transition-all duration-300 whitespace-nowrap flex items-center gap-2
                ${
                  isActive
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-white/80 backdrop-blur-sm border border-white/60 text-slate-700 hover:bg-white/90 hover:scale-105'
                }
              `}
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
                    }
                  : {}
              }
            >
              {subcategory.name}
              {isActive && <ChevronRight className="w-4 h-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
```

### 3. Enhanced Search & Filters

#### `GlobalSearchBar.tsx` (NEW)
```typescript
/**
 * Global search with autocomplete and voice input
 */
interface GlobalSearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  categories: Category[];
  recentSearches?: string[];
}

// Features:
// - Autocomplete with fuzzy matching
// - Category scoping
// - Voice search support
// - Recent searches history
// - Search suggestions
// - Real-time results preview
```

**Implementation Snippet:**
```typescript
import { Search, Mic, MapPin, Calendar } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useAutocomplete } from './hooks/useAutocomplete';

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onSearch,
  categories,
  recentSearches
}) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const { suggestions, loading } = useAutocomplete(debouncedQuery, categories);

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setVoiceActive(true);
      recognition.onend = () => setVoiceActive(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        onSearch(transcript, {});
      };

      recognition.start();
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Search Input */}
      <div className={`relative ${INPUT_STYLES.search} ${focused ? 'ring-4 ring-lime-600/30' : ''}`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search properties, services, events, and more..."
          className="w-full pl-12 pr-24 bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-500"
        />

        {/* Quick Filter Pills */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button className="p-2 hover:bg-lime-100/60 rounded-full transition-colors">
            <MapPin className="w-5 h-5 text-lime-600" />
          </button>
          <button className="p-2 hover:bg-lime-100/60 rounded-full transition-colors">
            <Calendar className="w-5 h-5 text-lime-600" />
          </button>
          <button
            onClick={handleVoiceSearch}
            className={`p-2 rounded-full transition-all ${
              voiceActive
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'hover:bg-lime-100/60 text-lime-600'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {focused && (suggestions.length > 0 || recentSearches?.length) && (
        <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60 overflow-hidden z-50">
          {/* Recent Searches */}
          {recentSearches && recentSearches.length > 0 && (
            <div className="p-3 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Recent</p>
              {recentSearches.slice(0, 3).map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(search);
                    onSearch(search, {});
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-lime-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Suggestions</p>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => {
                    setQuery(suggestion.title);
                    onSearch(suggestion.title, {});
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-lime-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {suggestion.image && (
                      <img
                        src={suggestion.image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{suggestion.title}</p>
                      <p className="text-xs text-slate-600">
                        {suggestion.category} • {suggestion.location}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

#### `AdvancedFiltersSidebar.tsx` (NEW)
```typescript
/**
 * Comprehensive filters sidebar with category-specific options
 */
interface AdvancedFiltersSidebarProps {
  category: Category | null;
  filters: ExploreFilters;
  onFiltersChange: (filters: ExploreFilters) => void;
  onReset: () => void;
}

// Filters include:
// - Price range slider
// - Location selector with map
// - Date range picker (availability)
// - Rating stars filter
// - Category-specific fields (bedrooms, bathrooms for real estate)
// - Amenities checkboxes
// - Transaction type (sale, rent, booking)
// - Sort options
```

**Implementation Snippet:**
```typescript
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { SlidersHorizontal, X, MapPin, Star } from 'lucide-react';

export const AdvancedFiltersSidebar: React.FC<AdvancedFiltersSidebarProps> = ({
  category,
  filters,
  onFiltersChange,
  onReset
}) => {
  const [priceRange, setPriceRange] = useState([filters.priceMin || 0, filters.priceMax || 10000]);
  const [location, setLocation] = useState(filters.location || '');
  const [rating, setRating] = useState(filters.rating || 0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const handleApplyFilters = () => {
    onFiltersChange({
      ...filters,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      location,
      rating,
      amenities: selectedAmenities,
    });
  };

  const activeFilterCount = Object.keys(filters).filter(key =>
    filters[key] !== null && filters[key] !== undefined
  ).length;

  return (
    <div className="w-80 h-full bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-lime-600" />
          <h3 className="font-bold text-slate-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-lime-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="text-sm text-slate-600 hover:text-lime-600 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          Price Range
        </label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={10000}
          step={50}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-slate-600">
          <span>€{priceRange[0].toLocaleString()}</span>
          <span>€{priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Location */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or region..."
            className={`${INPUT_STYLES.base} pl-10`}
          />
        </div>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          Minimum Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`p-2 rounded-lg transition-all ${
                rating >= star
                  ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-400 hover:bg-lime-100'
              }`}
            >
              <Star className={`w-5 h-5 ${rating >= star ? 'fill-current' : ''}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Category-Specific Filters */}
      {category?.slug === 'real-estate' && (
        <div className="space-y-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Bedrooms
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Any', '1+', '2+', '3+'].map((option) => (
                <button
                  key={option}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-lime-100 text-sm font-medium transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Property Type
            </label>
            <div className="space-y-2">
              {['Apartment', 'Villa', 'House', 'Land'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox />
                  <span className="text-sm text-slate-700">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apply Button */}
      <button
        onClick={handleApplyFilters}
        className={`${BUTTON_STYLES.primary} w-full`}
      >
        Apply Filters
      </button>
    </div>
  );
};
```

---

### 2. Listing Detail Modal

#### `ListingDetailModal.tsx` (NEW - CRITICAL)
```typescript
/**
 * Full-screen modal with all listing details and booking capability
 */
interface ListingDetailModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onBook: (booking: BookingData) => Promise<void>;
}

// Sections:
// - Image Gallery (with lightbox)
// - Header (Title, Price, Rating, Location)
// - Description & Amenities
// - Reviews Section
// - Host Profile
// - Availability Calendar
// - Booking Form (sticky sidebar)
// - Similar Listings
```

**Implementation Snippet:**
```typescript
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';
import { Star, MapPin, Share2, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookingForm } from './BookingForm';
import { ReviewsList } from './ReviewsList';
import { ImageGallery } from './ImageGallery';

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  onBook
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
        {/* Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <button
            onClick={onClose}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <Heart
                className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-700'}`}
              />
            </button>
            <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-full overflow-hidden">
          {/* Left: Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Image Gallery */}
            <div className="relative h-96 bg-slate-900">
              {listing.images && listing.images.length > 0 ? (
                <>
                  <img
                    src={listing.images[selectedImage].image}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation Arrows */}
                  {listing.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))}
                        disabled={selectedImage === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors disabled:opacity-50"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setSelectedImage(Math.min(listing.images!.length - 1, selectedImage + 1))}
                        disabled={selectedImage === listing.images.length - 1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors disabled:opacity-50"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Show All Photos Button */}
                  <button
                    onClick={() => setShowAllPhotos(true)}
                    className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors font-medium text-sm"
                  >
                    Show all {listing.images.length} photos
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm">
                    {selectedImage + 1} / {listing.images.length}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  No images available
                </div>
              )}
            </div>

            {/* Content Sections */}
            <div className="p-8 space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      {listing.title}
                    </h1>
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">4.8</span>
                        <span className="text-sm">(127 reviews)</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{listing.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-lime-100 rounded-full">
                  <span className="text-lime-700 font-medium text-sm">
                    {listing.category.name}
                  </span>
                  {listing.subcategory && (
                    <>
                      <span className="text-lime-600">•</span>
                      <span className="text-lime-600 text-sm">
                        {listing.subcategory.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-slate-200 pt-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Description</h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>

              {/* Dynamic Fields / Amenities */}
              {listing.dynamic_fields && Object.keys(listing.dynamic_fields).length > 0 && (
                <div className="border-t border-slate-200 pt-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(listing.dynamic_fields).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                          <span className="text-lime-600 font-semibold">
                            {value}
                          </span>
                        </div>
                        <span className="text-slate-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="border-t border-slate-200 pt-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Reviews <span className="text-slate-500">(127)</span>
                </h2>
                <ReviewsList listingId={listing.id} />
              </div>

              {/* Host Profile */}
              <div className="border-t border-slate-200 pt-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Hosted by</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {listing.owner.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{listing.owner.username}</p>
                    <p className="text-sm text-slate-600">Member since 2023</p>
                  </div>
                </div>
              </div>

              {/* Location Map (TODO: Integrate react-leaflet) */}
              <div className="border-t border-slate-200 pt-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Location</h2>
                <div className="h-64 bg-slate-200 rounded-xl flex items-center justify-center">
                  <p className="text-slate-500">Map view - Coming soon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Sidebar (Sticky) */}
          <div className="w-96 border-l border-slate-200 bg-white p-6 overflow-y-auto">
            <BookingForm
              listing={listing}
              onBook={onBook}
              onClose={onClose}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

### 3. Booking Flow Components

#### `BookingForm.tsx` (NEW - CRITICAL)
```typescript
/**
 * Sticky sidebar booking form with multi-step flow
 */
interface BookingFormProps {
  listing: Listing;
  onBook: (data: BookingData) => Promise<void>;
  onClose: () => void;
}

// Features:
// - Date/time selection
// - Guest/quantity input
// - Add-ons/extras
// - Price breakdown
// - Multi-step checkout
// - Payment integration
```

**Implementation Snippet:**
```typescript
import { useState } from 'react';
import { Calendar as CalendarIcon, Users, Plus, Minus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface BookingData {
  dates: { from: Date; to: Date };
  guests: number;
  addOns: string[];
  total: number;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  listing,
  onBook,
  onClose
}) => {
  const [step, setStep] = useState<'select' | 'details' | 'payment'>('select');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);

  const basePrice = typeof listing.price === 'number'
    ? listing.price
    : parseFloat(listing.price);

  const serviceFee = basePrice * 0.1;
  const totalPrice = basePrice + serviceFee;

  const handleSubmit = async () => {
    if (!dateRange.from || !dateRange.to) {
      alert('Please select dates');
      return;
    }

    setLoading(true);
    try {
      await onBook({
        dates: { from: dateRange.from, to: dateRange.to },
        guests,
        addOns: [],
        total: totalPrice,
      });
      onClose();
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Price Header */}
      <div className="sticky top-0 bg-white pb-4 border-b border-slate-200">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-slate-900">
            {listing.currency}{basePrice.toLocaleString()}
          </span>
          <span className="text-slate-600">
            {listing.transaction_type === 'rent_short' ? '/ night' :
             listing.transaction_type === 'rent_long' ? '/ month' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">4.8</span>
          <span className="text-slate-600">(127 reviews)</span>
        </div>
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Select Dates
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-slate-300 hover:border-lime-600 transition-colors">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700">
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                    ) : (
                      format(dateRange.from, 'MMM dd, yyyy')
                    )
                  ) : (
                    'Add dates'
                  )}
                </span>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Guests Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Guests
        </label>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-slate-300">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            <span className="text-slate-700">{guests} guest{guests !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="p-1 rounded-full hover:bg-lime-100 transition-colors"
            >
              <Minus className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setGuests(guests + 1)}
              className="p-1 rounded-full hover:bg-lime-100 transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="p-4 bg-slate-50 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-slate-700">
          <span>{listing.currency}{basePrice} x 1 {listing.transaction_type === 'rent_short' ? 'night' : 'item'}</span>
          <span className="font-medium">{listing.currency}{basePrice}</span>
        </div>
        <div className="flex items-center justify-between text-slate-700">
          <span>Service fee</span>
          <span className="font-medium">{listing.currency}{serviceFee.toFixed(2)}</span>
        </div>
        <div className="h-px bg-slate-300" />
        <div className="flex items-center justify-between text-slate-900 font-bold text-lg">
          <span>Total</span>
          <span>{listing.currency}{totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Book Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !dateRange.from || !dateRange.to}
        className={`${BUTTON_STYLES.primary} w-full disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? 'Processing...' : 'Reserve'}
      </button>

      <p className="text-xs text-center text-slate-600">
        You won't be charged yet
      </p>
    </div>
  );
};
```

---

### 4. Map View Integration

#### `MapView.tsx` (NEW)
```typescript
/**
 * Interactive map with listing pins and clustering
 */
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  listings: Listing[];
  center?: [number, number];
  zoom?: number;
  onListingClick: (listing: Listing) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  listings,
  center = [35.3213, 33.3224], // Default: Kyrenia, Cyprus
  zoom = 11,
  onListingClick
}) => {
  const listingsWithCoords = listings.filter(l => l.latitude && l.longitude);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup>
          {listingsWithCoords.map((listing) => (
            <Marker
              key={listing.id}
              position={[listing.latitude!, listing.longitude!]}
              eventHandlers={{
                click: () => onListingClick(listing)
              }}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-semibold">{listing.title}</p>
                  <p className="text-sm text-slate-600">
                    {listing.currency}{listing.price}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};
```

---

## API Specifications

### New Endpoints Required

#### 1. **Search & Autocomplete**
```python
# endpoints.py
GET /api/explore/search/
Query Params:
  - q: search query (string)
  - category: filter by category (string, optional)
  - limit: number of results (int, default 10)

Response:
{
  "suggestions": [
    {
      "id": "listing-123",
      "title": "Luxury Villa in Kyrenia",
      "category": "real-estate",
      "location": "Kyrenia",
      "image": "https://...",
      "price": "€500,000"
    }
  ],
  "count": 25
}
```

#### 2. **Advanced Filtering**
```python
GET /api/explore/listings/
Query Params:
  - category: category slug
  - subcategory: subcategory slug (optional)
  - price_min: minimum price (int)
  - price_max: maximum price (int)
  - location: location string
  - latitude: latitude for geospatial search
  - longitude: longitude for geospatial search
  - radius: search radius in km (int)
  - rating_min: minimum rating (float, 0-5)
  - available_from: ISO date
  - available_to: ISO date
  - sort: sort field ('-price', 'price', '-created_at', etc.)
  - page: page number
  - limit: results per page

Response:
{
  "count": 150,
  "next": "https://api.example.com/explore/listings/?page=2",
  "previous": null,
  "results": [Listing...]
}
```

#### 3. **Booking Creation**
```python
POST /api/bookings/
Headers:
  Authorization: Bearer <token>

Body:
{
  "listing_id": "listing-123",
  "start_date": "2025-12-01",
  "end_date": "2025-12-07",
  "guests": 2,
  "add_ons": ["airport_transfer"],
  "total_price": 3500.00,
  "payment_method": "stripe",
  "stripe_payment_intent_id": "pi_xxx"
}

Response:
{
  "id": "booking-456",
  "status": "confirmed",
  "confirmation_code": "ENC-12345",
  "listing": {Listing...},
  "start_date": "2025-12-01",
  "end_date": "2025-12-07",
  "guests": 2,
  "total_price": 3500.00,
  "created_at": "2025-11-16T12:00:00Z"
}
```

#### 4. **Reviews & Ratings**
```python
GET /api/listings/<id>/reviews/
Response:
{
  "count": 127,
  "average_rating": 4.8,
  "rating_breakdown": {
    "5": 95,
    "4": 25,
    "3": 5,
    "2": 1,
    "1": 1
  },
  "results": [
    {
      "id": "review-789",
      "user": {
        "id": "user-123",
        "username": "john_doe",
        "avatar": "https://..."
      },
      "rating": 5,
      "comment": "Amazing property! Highly recommend.",
      "created_at": "2025-10-15T10:00:00Z"
    }
  ]
}

POST /api/listings/<id>/reviews/
Headers:
  Authorization: Bearer <token>

Body:
{
  "rating": 5,
  "comment": "Great experience!"
}
```

#### 5. **Personalized Recommendations**
```python
GET /api/explore/recommendations/
Headers:
  Authorization: Bearer <token>

Response:
{
  "for_you": [Listing...],      // Based on browsing history
  "trending": [Listing...],      // Popular this week
  "similar_to_viewed": [Listing...], // If user viewed listing X
  "nearby": [Listing...]         // Based on user location
}
```

---

## User Flows & Wireframes

### Flow 1: Browse → Book (Core Happy Path)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LANDING                                                  │
│    User arrives at ExplorePage                              │
│    ├─ Hero section with global search                       │
│    ├─ Category quick links                                  │
│    └─ Featured spotlight carousel                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BROWSE                                                   │
│    User selects category (e.g., "Real Estate")             │
│    ├─ Grid view loads with listings                         │
│    ├─ Filter sidebar appears                                │
│    └─ User applies filters (price, location, beds)          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. DISCOVER                                                 │
│    User clicks on listing card                              │
│    └─ ListingDetailModal opens (fullscreen)                 │
│        ├─ Image gallery                                     │
│        ├─ Description & amenities                           │
│        ├─ Reviews                                            │
│        └─ Sticky booking sidebar                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SELECT DATES                                             │
│    User interacts with booking form                         │
│    ├─ Selects check-in/check-out dates                      │
│    ├─ Enters number of guests                               │
│    ├─ Reviews price breakdown                               │
│    └─ Clicks "Reserve"                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CHECKOUT (Multi-step)                                   │
│    Step 1: Confirm details                                  │
│    Step 2: Enter guest information                          │
│    Step 3: Payment method (Stripe)                          │
│    Step 4: Review & confirm                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. CONFIRMATION                                             │
│    Success page displays:                                   │
│    ├─ Booking confirmation code                             │
│    ├─ Calendar invite download                              │
│    ├─ Host contact info                                     │
│    └─ Next steps & support links                            │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Search → Filter → Book

```
User types "beach villa" in global search
  → Autocomplete suggests listings
  → User selects suggestion OR presses Enter
  → Results page loads with search applied
  → User refines with filters (price €300k-€500k, 3+ beds)
  → Results update in real-time
  → User clicks listing
  → [Continues to flow 1, step 3]
```

### Flow 3: Map Exploration

```
User clicks "Map View" toggle
  → Grid transforms to split view (map + sidebar)
  → Listings show as pins on map
  → User zooms/pans to area of interest
  → Clicks on pin cluster
  → Cluster expands to individual pins
  → User clicks pin
  → Sidebar shows mini listing card
  → User clicks "View Details"
  → ListingDetailModal opens
  → [Continues to flow 1, step 4]
```

---

### Wireframes

#### Desktop - Main Browse View
```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]  [Search: "beach villa kyrenia" 🔍🎤]  [Saved] [Profile] │
├─────────────────────────────────────────────────────────────────┤
│ Explore North Cyprus 🌴                                         │
│ Discover properties, services, events and more                  │
│ ┌───┬───┬───┬───┬───┬───┐                                       │
│ │🏠 │🔧 │🚗 │🍽️ │🎉 │🛍️ │ [Category Icons]                      │
│ └───┴───┴───┴───┴───┴───┘                                       │
├─────────────────────────────────────────────────────────────────┤
│ [Featured Carousel: 5 spotlight listings →]                     │
├─────────────────────────────────────────────────────────────────┤
│ [Real Estate] [Services] [Vehicles] [Active Tab]                │
│ [Villas] [Apartments] [Land] [All Subcategories]                │
│ ┌────────┬─────────────────────────────────────────────┬───────┐
│ │ FILTER │ Real Estate / Villas (247 listings)   [Sort▼] │ Grid ▼│
│ │  ───── │ ─────────────────────────────────────────────┤       │
│ │ Price  │ ┌─────┬─────┬─────┐ ┌─────┬─────┬─────┐     │       │
│ │ €0-max │ │ IMG │ IMG │ IMG │ │ IMG │ IMG │ IMG │     │       │
│ │ ──── │ │ Villa│ Apt │House│ │ Villa│ Apt │House│     │       │
│ │        │ │ €500k│€300k│€450k│ │ €550k│€280k│€420k│     │       │
│ │Location│ │ ★4.8│ ★4.9│ ★4.7│ │ ★4.6│ ★5.0│ ★4.8│     │       │
│ │ [City▼]│ └─────┴─────┴─────┘ └─────┴─────┴─────┘     │       │
│ │        │ ┌─────┬─────┬─────┐ ┌─────┬─────┬─────┐     │       │
│ │ Rating │ │ IMG │ IMG │ IMG │ │ IMG │ IMG │ IMG │     │       │
│ │ ★★★★☆+ │ │ Land│Villa│ Apt │ │House│Villa│Land │     │       │
│ │        │ │ €200k│€600k│€320k│ │ €480k│€590k│€180k│     │       │
│ │ Beds   │ │ ★4.5│ ★4.9│ ★4.8│ │ ★4.7│ ★4.8│ ★4.6│     │       │
│ │ [Any▼] │ └─────┴─────┴─────┘ └─────┴─────┴─────┘     │       │
│ │        │ [Load More...]                                │       │
│ │ [Apply]│                                               │       │
│ └────────┴───────────────────────────────────────────────┴───────┘
│ [Trending This Week →]                                          │
│ [New Listings →]                                                │
└─────────────────────────────────────────────────────────────────┘
```

#### Desktop - Listing Detail Modal
```
┌─────────────────────────────────────────────────────────────────┐
│ [X] ────────────────────────────────────── [♡] [↗Share]         │
│ ┌───────────────────────────────┬──────────────────────────────┐│
│ │ [← → IMAGE GALLERY]           │ BOOKING SIDEBAR              ││
│ │                               │ €500,000                     ││
│ │ [Show all 24 photos]          │ ★4.8 (127 reviews)           ││
│ ├───────────────────────────────┤ ─────────────────────────────││
│ │ Luxury Villa in Kyrenia       │ Dates:                       ││
│ │ ★4.8 (127) • Kyrenia, Cyprus  │ [Dec 1 - Dec 7 📅]           ││
│ │ Real Estate • Villa           │                              ││
│ │                               │ Guests:                      ││
│ │ Description                   │ [2 guests 👥]                ││
│ │ Lorem ipsum dolor sit amet... │                              ││
│ │                               │ Price Breakdown              ││
│ │ Details                       │ €500,000 x 1                 ││
│ │ ┌──┬──┬──┬──┐                 │ Service fee: €50,000         ││
│ │ │3 │2 │180│Yes│                │ ─────────────────────────────││
│ │ │Bed│Bath│m² │Pool│            │ Total: €550,000              ││
│ │ └──┴──┴──┴──┘                 │                              ││
│ │                               │ [Reserve Now →]              ││
│ │ Reviews ★4.8 (127)            │                              ││
│ │ ┌─────────────────────────┐   │ You won't be charged yet     ││
│ │ │ ★★★★★ "Amazing!"        │   │                              ││
│ │ │ by John • Oct 2025      │   │                              ││
│ │ └─────────────────────────┘   │                              ││
│ │ [Show all reviews]            │                              ││
│ │                               │                              ││
│ │ Location                      │                              ││
│ │ [MAP VIEW]                    │                              ││
│ └───────────────────────────────┴──────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### Mobile - Browse View
```
┌──────────────────────┐
│ [🍔] Explore    [🔍] │
├──────────────────────┤
│ Search...       [🎤] │
├──────────────────────┤
│ 🏠 🔧 🚗 🍽️ 🎉 🛍️   │ [Horizontal scroll]
├──────────────────────┤
│ [Featured →]         │
│ ┌──────────────────┐ │
│ │ [Large Image]    │ │
│ │ Luxury Villa     │ │
│ │ €500k ★4.8       │ │
│ └──────────────────┘ │
├──────────────────────┤
│ Real Estate          │
│ [Villas ▼]           │
│ [Filters (3)]        │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ [Image]          │ │
│ │ Beach Villa      │ │
│ │ €450k ★4.9       │ │
│ │ 3 bed • Kyrenia  │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ [Image]          │ │
│ │ Modern Apt       │ │
│ │ €300k ★4.7       │ │
│ │ 2 bed • Famagusta│ │
│ └──────────────────┘ │
│ [Load More...]       │
└──────────────────────┘
```

---

## Advanced Features Implementation

### 1. Real-time Availability Updates

**Frontend:**
```typescript
// useRealtimeAvailability.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeAvailability = (listingId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(`wss://api.example.com/ws/listings/${listingId}/`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'availability_update') {
        // Invalidate query to refetch latest availability
        queryClient.invalidateQueries(['listing', listingId]);
      }
    };

    return () => ws.close();
  }, [listingId, queryClient]);
};
```

**Backend (Django Channels):**
```python
# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ListingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.listing_id = self.scope['url_route']['kwargs']['listing_id']
        self.room_group_name = f'listing_{self.listing_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def availability_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'availability_update',
            'data': event['data']
        }))
```

---

### 2. AI-Powered Recommendations

**Implementation:**
```typescript
// recommendationsEngine.ts
import { Listing, User } from './types';

interface UserBehavior {
  viewedListings: string[];
  savedListings: string[];
  searchQueries: string[];
  clickedCategories: string[];
}

export const generateRecommendations = async (
  user: User,
  behavior: UserBehavior,
  allListings: Listing[]
): Promise<Listing[]> => {
  // 1. Content-based filtering
  const categoryScores = behavior.clickedCategories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 2. Collaborative filtering (similar users)
  const similarUsers = await fetchSimilarUsers(user.id);
  const popularAmongSimilar = await fetchPopularListings(similarUsers.map(u => u.id));

  // 3. Hybrid scoring
  const scored = allListings.map(listing => {
    let score = 0;

    // Category preference
    score += (categoryScores[listing.category.slug] || 0) * 10;

    // Price range preference
    const avgPrice = behavior.viewedListings
      .map(id => allListings.find(l => l.id === id)?.price)
      .filter(Boolean)
      .reduce((a, b) => (a + b) / 2, 0);

    const priceDiff = Math.abs(Number(listing.price) - avgPrice);
    score += Math.max(0, 100 - priceDiff / 100);

    // Popularity
    score += listing.views * 0.1;

    // Similar user preference
    if (popularAmongSimilar.some(l => l.id === listing.id)) {
      score += 50;
    }

    return { listing, score };
  });

  // Sort and return top 10
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(s => s.listing);
};
```

---

### 3. Progressive Image Loading

**Component:**
```typescript
// ProgressiveImage.tsx
import { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  placeholder: string;
  alt: string;
  className?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholder,
  alt,
  className = ''
}) => {
  const [imgSrc, setImgSrc] = useState(placeholder);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImgSrc(src);
      setLoaded(true);
    };
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${className} transition-all duration-500 ${
        loaded ? 'blur-0' : 'blur-md'
      }`}
    />
  );
};
```

---

### 4. Geolocation & Radius Search

**Frontend:**
```typescript
// useGeolocation.ts
import { useState, useEffect } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          setError(err.message);
        }
      );
    } else {
      setError('Geolocation not supported');
    }
  }, []);

  return { location, error };
};
```

**Backend:**
```python
# filters.py
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D  # Distance

class ListingFilter(filters.FilterSet):
    latitude = filters.NumberFilter(method='filter_by_distance')
    longitude = filters.NumberFilter(method='filter_by_distance')
    radius = filters.NumberFilter()  # in kilometers

    def filter_by_distance(self, queryset, name, value):
        latitude = self.request.query_params.get('latitude')
        longitude = self.request.query_params.get('longitude')
        radius = self.request.query_params.get('radius', 10)  # default 10km

        if latitude and longitude:
            user_location = Point(float(longitude), float(latitude), srid=4326)
            return queryset.filter(
                location__distance_lte=(user_location, D(km=radius))
            ).annotate(
                distance=Distance('location', user_location)
            ).order_by('distance')

        return queryset
```

---

## Performance & Optimization

### 1. Image Optimization

**CDN Integration:**
```typescript
// imageOptimizer.ts
export const optimizeImageUrl = (
  url: string,
  width: number,
  height: number,
  quality: number = 80
): string => {
  // Example using Cloudinary
  const cloudinaryBase = 'https://res.cloudinary.com/yourcloud/image/upload/';
  const transformations = `w_${width},h_${height},c_fill,q_${quality},f_auto`;

  // Extract public ID from original URL
  const publicId = url.split('/').slice(-1)[0];

  return `${cloudinaryBase}${transformations}/${publicId}`;
};

// Usage:
<img
  src={optimizeImageUrl(listing.image, 400, 300, 80)}
  alt={listing.title}
/>
```

---

### 2. React Query Caching Strategy

```typescript
// queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Listings: 5 minute stale time
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,

      // Refetch on window focus for real-time feel
      refetchOnWindowFocus: true,

      // Keep previous data while fetching new data (better UX)
      keepPreviousData: true,

      // Retry failed requests
      retry: 2,
    },
  },
});

// Specific query configurations
export const QUERY_KEYS = {
  listings: (filters: ExploreFilters) => ['listings', filters],
  listing: (id: string) => ['listing', id],
  categories: () => ['categories'],
  reviews: (listingId: string) => ['reviews', listingId],
  recommendations: (userId: string) => ['recommendations', userId],
};

// Prefetching strategy
export const prefetchListingDetails = async (listingId: string) => {
  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.listing(listingId),
    queryFn: () => fetchListing(listingId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

---

### 3. Virtualization for Large Lists

```typescript
// VirtualizedGrid.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualizedGridProps {
  listings: Listing[];
  onListingClick: (listing: Listing) => void;
}

export const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  listings,
  onListingClick
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(listings.length / 3), // 3 columns
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Estimated row height
    overscan: 2, // Render 2 extra rows above/below viewport
  });

  return (
    <div
      ref={parentRef}
      className="h-[800px] overflow-auto"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * 3;
          const rowListings = listings.slice(startIndex, startIndex + 3);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="grid grid-cols-3 gap-6"
            >
              {rowListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => onListingClick(listing)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

### 4. Lazy Loading & Code Splitting

```typescript
// ExplorePage.tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const ListingDetailModal = lazy(() => import('./components/ListingDetailModal'));
const MapView = lazy(() => import('./components/MapView'));
const AdvancedFiltersSidebar = lazy(() => import('./components/AdvancedFiltersSidebar'));

export const ExplorePage: React.FC = () => {
  // ... existing code

  return (
    <div>
      {/* Main content loads immediately */}
      <CategoryTabs {...} />
      <ExploreGrid {...} />

      {/* Heavy components load on demand */}
      <Suspense fallback={<LoadingSpinner />}>
        {showDetailModal && <ListingDetailModal {...} />}
      </Suspense>

      <Suspense fallback={<div>Loading map...</div>}>
        {viewMode === 'map' && <MapView {...} />}
      </Suspense>
    </div>
  );
};
```

---

## Testing Strategy

### 1. Unit Tests (Jest + React Testing Library)

```typescript
// ListingCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ListingCard } from './ListingCard';

describe('ListingCard', () => {
  const mockListing = {
    id: '1',
    title: 'Test Villa',
    price: 500000,
    currency: '€',
    location: 'Kyrenia',
    category: { id: '1', slug: 'real-estate', name: 'Real Estate' },
  };

  it('should render listing information', () => {
    render(<ListingCard listing={mockListing} onClick={jest.fn()} />);

    expect(screen.getByText('Test Villa')).toBeInTheDocument();
    expect(screen.getByText('€500,000')).toBeInTheDocument();
    expect(screen.getByText(/Kyrenia/i)).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<ListingCard listing={mockListing} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(mockListing);
  });

  it('should display featured badge for featured listings', () => {
    const featuredListing = { ...mockListing, is_featured: true };
    render(<ListingCard listing={featuredListing} onClick={jest.fn()} />);

    expect(screen.getByText(/Featured/i)).toBeInTheDocument();
  });
});
```

---

### 2. Integration Tests

```typescript
// BookingFlow.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { ExplorePage } from './ExplorePage';

describe('Booking Flow Integration', () => {
  it('should complete booking flow from browse to confirmation', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <ExplorePage />
      </QueryClientProvider>
    );

    // 1. Select category
    await user.click(screen.getByText('Real Estate'));

    // 2. Click on listing
    await waitFor(() => screen.getByText('Beach Villa'));
    await user.click(screen.getByText('Beach Villa'));

    // 3. Modal opens
    await waitFor(() => screen.getByText(/Select Dates/i));

    // 4. Select dates
    const dateButton = screen.getByRole('button', { name: /Add dates/i });
    await user.click(dateButton);
    // ... select dates from calendar

    // 5. Enter guests
    const guestsInput = screen.getByLabelText(/Guests/i);
    await user.click(screen.getByRole('button', { name: /plus/i }));

    // 6. Click reserve
    await user.click(screen.getByRole('button', { name: /Reserve/i }));

    // 7. Verify confirmation
    await waitFor(() =>
      expect(screen.getByText(/Booking Confirmed/i)).toBeInTheDocument()
    );
  });
});
```

---

### 3. E2E Tests (Cypress)

```typescript
// cypress/e2e/explore-booking.cy.ts
describe('Explore & Booking Flow', () => {
  beforeEach(() => {
    cy.visit('/explore');
  });

  it('should allow user to browse, filter, and book a listing', () => {
    // Browse
    cy.contains('Real Estate').click();
    cy.contains('247 listings found').should('be.visible');

    // Filter
    cy.get('[data-testid="filters-toggle"]').click();
    cy.get('[data-testid="price-slider"]').invoke('val', 300000).trigger('change');
    cy.contains('Apply Filters').click();

    // View listing
    cy.get('[data-testid="listing-card"]').first().click();
    cy.get('[data-testid="listing-modal"]').should('be.visible');

    // Book
    cy.get('[data-testid="date-picker"]').click();
    cy.get('[aria-label="Dec 1, 2025"]').click();
    cy.get('[aria-label="Dec 7, 2025"]').click();
    cy.contains('Reserve').click();

    // Confirm
    cy.get('[data-testid="payment-form"]').within(() => {
      cy.get('[name="cardNumber"]').type('4242424242424242');
      cy.get('[name="expiry"]').type('12/27');
      cy.get('[name="cvc"]').type('123');
    });

    cy.contains('Confirm Booking').click();

    // Verify success
    cy.contains('Booking Confirmed').should('be.visible');
    cy.get('[data-testid="confirmation-code"]').should('exist');
  });

  it('should show real-time availability updates', () => {
    cy.visit('/explore/listing/123');

    // Simulate WebSocket update
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('availability-update', {
        detail: { available: false }
      }));
    });

    cy.contains('No longer available').should('be.visible');
  });
});
```

---

### 4. Performance Tests (Lighthouse CI)

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000/explore
            http://localhost:3000/explore/listing/123
          uploadArtifacts: true
          temporaryPublicStorage: true
```

**Expected Metrics:**
- **Performance:** ≥ 90
- **Accessibility:** ≥ 95
- **Best Practices:** ≥ 90
- **SEO:** ≥ 95

---

## Phased Implementation Roadmap

### **Phase 1: Foundation (Weeks 1-2)**

#### Week 1: Core Structure
- [ ] Set up advanced filter sidebar component
- [ ] Implement global search bar with autocomplete API
- [ ] Create view toggle (Grid / List / Map)
- [ ] Wire up existing sort dropdown
- [ ] Add loading skeletons for better UX

**Deliverables:**
- `AdvancedFiltersSidebar.tsx`
- `GlobalSearchBar.tsx`
- `ViewToggle.tsx`
- Updated `ExplorePage.tsx` with new components

**Testing:**
- Unit tests for each new component
- Integration test for filter application

---

#### Week 2: Listing Detail Modal
- [ ] Build `ListingDetailModal` component
- [ ] Implement image gallery with lightbox
- [ ] Create reviews section (read-only for now)
- [ ] Add host profile display
- [ ] Integrate share functionality

**Deliverables:**
- `ListingDetailModal.tsx`
- `ImageGallery.tsx`
- `ReviewsList.tsx` (display only)
- `ShareButton.tsx`

**Testing:**
- Modal open/close functionality
- Image navigation
- Responsive design tests

---

### **Phase 2: Core Booking (Weeks 3-5)**

#### Week 3: Booking Form
- [ ] Build `BookingForm` component
- [ ] Implement date range picker
- [ ] Add guest/quantity selector
- [ ] Create price breakdown display
- [ ] Wire up booking API endpoint

**Deliverables:**
- `BookingForm.tsx`
- `DateRangePicker.tsx`
- `PriceBreakdown.tsx`
- Backend: `/api/bookings/` endpoint

**Testing:**
- Form validation tests
- Date selection edge cases
- Price calculation accuracy

---

#### Week 4: Payment Integration
- [ ] Integrate Stripe payment elements
- [ ] Build checkout flow (multi-step)
- [ ] Implement booking confirmation page
- [ ] Add email notifications
- [ ] Create booking history view

**Deliverables:**
- `CheckoutFlow.tsx`
- `PaymentForm.tsx`
- `ConfirmationPage.tsx`
- Backend: Stripe webhook handlers

**Testing:**
- Payment flow E2E tests
- Webhook handling tests
- Error scenario handling

---

#### Week 5: Reviews & Ratings
- [ ] Build review submission form
- [ ] Implement star rating component
- [ ] Create review moderation system
- [ ] Add rating breakdown display
- [ ] Enable photo uploads in reviews

**Deliverables:**
- `ReviewForm.tsx`
- `StarRating.tsx`
- Backend: `/api/listings/<id>/reviews/` endpoints

**Testing:**
- Review submission tests
- Rating calculation tests
- Moderation workflow tests

---

### **Phase 3: Advanced Features (Weeks 6-8)**

#### Week 6: Maps Integration
- [ ] Integrate react-leaflet
- [ ] Build `MapView` component
- [ ] Implement marker clustering
- [ ] Add geolocation search
- [ ] Create map+sidebar split view

**Deliverables:**
- `MapView.tsx`
- `ListingMarker.tsx`
- Backend: Geospatial queries

**Testing:**
- Map rendering tests
- Geolocation permission handling
- Marker click functionality

---

#### Week 7: Personalization
- [ ] Build recommendation engine
- [ ] Implement browsing history tracking
- [ ] Create "For You" section
- [ ] Add saved listings functionality
- [ ] Build user preferences settings

**Deliverables:**
- `recommendationsEngine.ts`
- `ForYouSection.tsx`
- `SavedListings.tsx`
- Backend: User behavior tracking

**Testing:**
- Recommendation algorithm tests
- Privacy compliance tests
- Preference persistence tests

---

#### Week 8: Real-time Features
- [ ] Set up Django Channels for WebSockets
- [ ] Implement live availability updates
- [ ] Add real-time booking notifications
- [ ] Create live chat with hosts
- [ ] Build activity feed

**Deliverables:**
- WebSocket consumers (backend)
- `useRealtimeAvailability` hook
- `LiveChat.tsx`
- `ActivityFeed.tsx`

**Testing:**
- WebSocket connection tests
- Message delivery tests
- Reconnection handling

---

### **Phase 4: Polish & Optimization (Weeks 9-10)**

#### Week 9: Performance Optimization
- [ ] Implement image optimization (CDN)
- [ ] Add virtualization for large lists
- [ ] Set up service worker for offline
- [ ] Optimize bundle size (code splitting)
- [ ] Add progressive image loading

**Deliverables:**
- `VirtualizedGrid.tsx`
- `ProgressiveImage.tsx`
- Service worker configuration
- Webpack/Vite optimizations

**Testing:**
- Lighthouse performance audits
- Bundle size analysis
- Load time tests

---

#### Week 10: Accessibility & Final Testing
- [ ] WCAG 2.1 AA compliance audit
- [ ] Keyboard navigation improvements
- [ ] Screen reader testing & fixes
- [ ] High contrast mode support
- [ ] Comprehensive E2E test suite

**Deliverables:**
- Accessibility documentation
- E2E test suite (Cypress)
- Performance benchmarks
- User acceptance testing

**Testing:**
- Automated accessibility tests
- Manual screen reader tests
- Cross-browser testing
- Mobile device testing

---

## Success Metrics & KPIs

### Engagement Metrics
| Metric | Baseline | Target (6 months) | Measurement |
|--------|----------|-------------------|-------------|
| Avg Session Duration | 3.5 min | 5 min (+43%) | Google Analytics |
| Pages per Session | 4.2 | 6.5 (+55%) | Google Analytics |
| Bounce Rate | 45% | 30% (-33%) | Google Analytics |
| Listings Viewed per Session | 8 | 15 (+88%) | Custom tracking |

### Conversion Metrics
| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Browse → Detail View | 25% | 40% | Funnel analysis |
| Detail → Booking Initiated | 12% | 20% | Funnel analysis |
| Booking → Confirmed | 65% | 80% | Payment system |
| Overall Conversion Rate | 1.95% | 6.4% (+228%) | End-to-end funnel |

### Business Impact
| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Monthly Bookings | 850 | 1,300 (+53%) | Database |
| Average Booking Value | €1,200 | €1,500 (+25%) | Payment records |
| Cross-Category Browsing | 15% | 45% (+200%) | User flow tracking |
| Repeat Booking Rate | 20% | 35% (+75%) | User cohort analysis |

### Technical Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time (P95) | < 2s | Lighthouse / RUM |
| Search Response Time (P95) | < 300ms | APM tools |
| Booking Flow Completion Time | < 3 min | User session recordings |
| Error Rate | < 0.5% | Error tracking (Sentry) |
| Uptime | 99.9% | Monitoring (Datadog) |

### User Satisfaction
| Metric | Target | Measurement |
|--------|--------|-------------|
| Net Promoter Score (NPS) | ≥ 50 | Quarterly surveys |
| Customer Satisfaction (CSAT) | ≥ 4.5/5 | Post-booking surveys |
| Feature Adoption (Filters) | ≥ 60% | Feature usage tracking |
| Feature Adoption (Map View) | ≥ 30% | Feature usage tracking |

---

## Deployment & Rollout Strategy

### Staged Rollout

1. **Internal Beta (Week 11)**
   - Deploy to staging environment
   - Internal team testing (10-15 users)
   - Bug fixes and refinements

2. **Closed Beta (Week 12)**
   - Invite 100 trusted users
   - Collect detailed feedback
   - Monitor performance metrics
   - Iterate on UX issues

3. **Soft Launch (Week 13)**
   - 20% traffic rollout (A/B test)
   - Monitor conversion rates
   - Compare with old explore page
   - Gradual increase if metrics positive

4. **Full Launch (Week 14)**
   - 100% traffic to new explore page
   - Sunset old explore page
   - Celebrate launch 🎉
   - Continue monitoring & iterating

---

## Risk Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance degradation with 1000+ listings | High | Medium | Implement virtualization, pagination, caching |
| Payment integration issues | Critical | Low | Thorough testing, sandbox environment, fallback to contact form |
| Map API costs | Medium | High | Set usage limits, implement clustering, cache tiles |
| Browser compatibility | Medium | Medium | Polyfills, feature detection, graceful degradation |
| GDPR compliance with tracking | High | Medium | User consent management, data anonymization, privacy policy |
| Real-time updates overwhelming server | High | Low | Rate limiting, connection pooling, horizontal scaling |

---

## Budget Estimates

### Development Costs
- **Frontend Development:** 320 hours @ $100/hr = **$32,000**
- **Backend Development:** 160 hours @ $120/hr = **$19,200**
- **Design & UX:** 80 hours @ $90/hr = **$7,200**
- **Testing & QA:** 80 hours @ $80/hr = **$6,400**
- **Project Management:** 40 hours @ $110/hr = **$4,400**

**Total Development:** **$69,200**

### Infrastructure & Tools
- **Stripe fees:** 2.9% + €0.30 per transaction
- **CDN (Cloudinary):** ~$200/month
- **WebSocket hosting (Channels):** ~$150/month
- **Maps API (OpenStreetMap - Free):** $0
- **Monitoring (Datadog):** ~$180/month
- **Error tracking (Sentry):** ~$80/month

**Monthly Recurring:** ~$610/month

### ROI Projection

**Assumptions:**
- Current monthly bookings: 850
- Target increase: +53% = 1,300 bookings/month
- Additional bookings: 450/month
- Avg booking value: €1,200
- Platform fee: 10%

**Monthly Additional Revenue:**
450 bookings × €1,200 × 10% = **€54,000/month**

**Payback Period:**
€69,200 / €54,000 = **1.3 months**

---

## Appendix

### Tech Stack Summary

**Frontend:**
- React 18.2 + TypeScript
- TanStack Query (React Query) 5.90.8
- React Router 6.30.1
- Tailwind CSS 3.3.2
- Framer Motion 11.5.6
- React Leaflet 4.2.1
- Lucide React 0.263.1
- Radix UI components

**Backend:**
- Django 5.2.5
- Django REST Framework
- Django Channels (WebSockets)
- PostgreSQL with PostGIS
- Redis (caching + Channels layer)
- Celery (async tasks)

**Payment:**
- Stripe Elements
- Stripe Webhooks

**Infrastructure:**
- Railway/Heroku (hosting)
- Cloudinary (CDN)
- OpenStreetMap (maps - free)

---

## Next Steps

1. **Review & Approve Plan:** Stakeholder sign-off
2. **Set Up Project Board:** Create Jira/Linear tickets for all tasks
3. **Assemble Team:** Assign developers, designer, QA
4. **Kickoff Meeting:** Align team on vision and timeline
5. **Start Phase 1 (Week 1):** Begin foundation work

---

**Document Status:** ✅ **READY FOR REVIEW**

**Created:** 2025-11-16

**Author:** Claude Code (Anthropic)

**Version:** 1.0

---
