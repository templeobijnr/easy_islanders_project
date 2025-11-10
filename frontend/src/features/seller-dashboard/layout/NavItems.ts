import { Package, Mail, Radio, ShoppingBag, MessageCircle, TrendingUp, Store, LifeBuoy } from "lucide-react";

export const navItems = [
  { name: "My Listings", path: "/dashboard/my-listings", icon: Package },
  { name: "Seller Inbox", path: "/dashboard/seller-inbox", icon: Mail },
  { name: "Broadcasts", path: "/dashboard/broadcasts", icon: Radio },
  { name: "Sales", path: "/dashboard/sales", icon: ShoppingBag },
  { name: "Messages", path: "/dashboard/messages", icon: MessageCircle },
  { name: "Analytics", path: "/dashboard/analytics", icon: TrendingUp },
  { name: "Business Profile", path: "/dashboard/profile", icon: Store },
  { name: "Help & Support", path: "/dashboard/help", icon: LifeBuoy },
];
