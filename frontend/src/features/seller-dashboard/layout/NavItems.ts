import { List, Megaphone, BarChart3, Settings, Inbox, DollarSign, MessageSquare, HelpCircle } from "lucide-react";

export const navItems = [
  { name: "My Listings", path: "/dashboard/my-listings", icon: List },
  { name: "Seller Inbox", path: "/dashboard/seller-inbox", icon: Inbox },
  { name: "Broadcasts", path: "/dashboard/broadcasts", icon: Megaphone },
  { name: "Sales", path: "/dashboard/sales", icon: DollarSign },
  { name: "Messages", path: "/dashboard/messages", icon: MessageSquare },
  { name: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
  { name: "Business Profile", path: "/dashboard/profile", icon: Settings },
  { name: "Help & Support", path: "/dashboard/help", icon: HelpCircle },
];
