# shadcn/ui Components - Easy Islanders

This directory contains shadcn/ui component examples customized for Easy Islanders with your lime green brand (#6CC24A).

## 🎨 Theme Customization

Your theme variables are configured in `/src/index.css` with:

```css
--primary: 103 59% 53%;  /* #6CC24A - Lime green */
--success: 142 76% 36%;  /* Green for successful actions */
--warning: 38 92% 50%;   /* Orange/yellow for warnings */
--chart-1 to --chart-5   /* Analytics/dashboard colors */
```

## 📦 Available Components

### Core UI Components (in `/src/components/ui/`)
- ✅ `button.tsx` - Buttons with custom variants (premium, glass)
- ✅ `card.tsx` - Cards with CardAction support
- ✅ `input.tsx` - Form inputs
- ✅ `label.tsx` - Form labels
- ✅ `dropdown-menu.tsx` - Dropdown menus
- ✅ `calendar.tsx` - Date picker
- ✅ `badge.tsx` - Status badges
- ✅ `dialog.tsx` - Modals
- ✅ `tabs.tsx` - Tabbed interfaces
- ✅ `avatar.tsx` - User avatars
- ✅ `tooltip.tsx` - Tooltips
- ✅ `select.tsx` - Dropdowns
- ✅ `progress.tsx` - Progress bars

### Custom Examples (this directory)
- 🎯 `UserAccountDropdown.tsx` - User menu for navigation
- 📅 `BookingCalendar.tsx` - Date picker for bookings
- 🔐 `LoginCard.tsx` - Authentication card

## 🚀 Quick Start

### 1. User Account Dropdown

Add to your Header component:

```tsx
import { UserAccountDropdown } from '@/components/examples/UserAccountDropdown';

function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <Logo />
      <UserAccountDropdown />
    </header>
  );
}
```

### 2. Booking Calendar

Use in your booking flow or listing detail pages:

```tsx
import { BookingCalendar } from '@/components/examples/BookingCalendar';

function ListingDetail({ listing }) {
  const handleDateSelect = (checkIn, checkOut) => {
    console.log('Selected dates:', checkIn, checkOut);
    // Handle booking logic
  };

  return (
    <div>
      <BookingCalendar
        pricePerDay={listing.price_per_night}
        bookedDates={listing.booked_dates}
        minNights={2}
        maxNights={30}
        onSelect={handleDateSelect}
      />
    </div>
  );
}
```

### 3. Login Card

Replace your existing auth modal:

```tsx
import { LoginCard } from '@/components/examples/LoginCard';

function AuthModal() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginCard
        onSuccess={() => console.log('Logged in!')}
        showSignUp={true}
      />
    </div>
  );
}
```

## 🎯 Integration with Existing Pages

### Settings Page

Replace existing form elements with shadcn components:

```tsx
// Before
<input type="email" value={email} onChange={e => setEmail(e.target.value)} />

// After
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={e => setEmail(e.target.value)}
  />
</div>
```

### Bookings Page

Add calendar for filtering:

```tsx
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function BookingsFilter() {
  const [date, setDate] = React.useState<Date>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter by Date</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-xl border"
        />
      </CardContent>
    </Card>
  );
}
```

### Chat/Messages Page

Add dropdown for message actions:

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Archive, Trash, Flag } from 'lucide-react';

function MessageActions({ messageId }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive">
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Flag className="mr-2 h-4 w-4" />
          Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## 🎨 Custom Button Variants

Your Button component has custom variants:

```tsx
import { Button } from "@/components/ui/button";

// Standard variants
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outlined</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link Style</Button>

// Custom Easy Islanders variants
<Button variant="premium">Premium Feature</Button>
<Button variant="glass">Glass Effect</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
<Button size="icon"><Icon /></Button>
```

## 💡 Best Practices

### 1. Use Consistent Spacing

```tsx
// Good: Use Tailwind spacing classes
<div className="space-y-4">
  <Card>...</Card>
  <Card>...</Card>
</div>

// Better: Use gap for flex/grid
<div className="flex flex-col gap-4">
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### 2. Maintain Brand Colors

```tsx
// Use semantic color variables
<Button className="bg-primary text-primary-foreground">
<Badge variant="secondary" className="text-success">Confirmed</Badge>
<div className="text-warning">Warning message</div>
```

### 3. Responsive Design

```tsx
<Card className="w-full max-w-sm md:max-w-md lg:max-w-lg">
  {/* Content */}
</Card>
```

### 4. Loading States

```tsx
import { Loader2 } from 'lucide-react';

<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

### 5. Error States

```tsx
{error && (
  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
    {error}
  </div>
)}
```

## 🔄 Replacing Existing Components

### Profile Page
```tsx
// Before: Custom styled divs
<div className="user-profile">
  <div className="avatar">{user.name[0]}</div>
  <div className="info">...</div>
</div>

// After: shadcn components
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <div className="bg-primary text-primary-foreground font-bold text-2xl">
          {user.name[0]}
        </div>
      </Avatar>
      <CardTitle>{user.name}</CardTitle>
    </div>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Requests Page
```tsx
// Add status badges
import { Badge } from "@/components/ui/badge";

<Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
  {request.status}
</Badge>
```

### Dashboard/Analytics
```tsx
// Use chart color variables
<div style={{ backgroundColor: `hsl(var(--chart-1))` }}>
  Listings Count
</div>
<div style={{ backgroundColor: `hsl(var(--chart-2))` }}>
  Rentals
</div>
```

## 📚 Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

## 🐛 Troubleshooting

### Import Path Issues

If you get "Cannot find module '@/components/ui/...'" errors:

1. Check your `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

2. Or use relative imports:
```tsx
import { Button } from "../../components/ui/button";
```

### Styling Not Applied

Make sure `tailwind.config.js` includes:
```js
content: [
  "./src/**/*.{js,jsx,ts,tsx}",
],
```

### Component Not Rendering

Check that you've imported both the component and its styles:
```tsx
import { Button } from "@/components/ui/button"; // ✅
import "@/components/ui/button.css"; // ❌ Not needed with Tailwind
```

## 🎉 Next Steps

1. **Replace existing buttons** with shadcn Button component
2. **Add UserAccountDropdown** to your Header
3. **Use BookingCalendar** in listing pages
4. **Integrate Cards** in dashboard and listings
5. **Add Dropdowns** for action menus
6. **Use Badges** for status indicators
7. **Implement Dialogs** for confirmations

Enjoy building with shadcn/ui! 🚀
