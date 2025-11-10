import { List, Megaphone, BarChart3, User, Inbox } from "lucide-react";

export const navItems = [
  { name: "My Listings", path: "/dashboard/my-listings", icon: List },
  { name: "Seller Inbox", path: "/dashboard/seller-inbox", icon: Inbox },
  { name: "Broadcasts", path: "/dashboard/broadcasts", icon: Megaphone },
  { name: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
  { name: "Profile", path: "/dashboard/profile", icon: User },
];
