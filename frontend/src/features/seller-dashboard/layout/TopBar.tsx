import { useSellerProfile } from "../../../hooks/useSellerDashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../../contexts/AuthContext";

interface SellerProfile {
  business_name: string;
  verified: boolean;
  logo_url?: string;
  total_listings?: number;
}

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { seller, loading } = useSellerProfile() as {
    seller: SellerProfile | null;
    loading: boolean;
    error: any;
  };
  const { logout } = useAuth();

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 fixed top-0 lg:left-60 left-0 right-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        )}

        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {loading ? "Loading..." : seller?.business_name || "Seller Dashboard"}
          </h1>
          {seller?.verified && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              ✓ Verified Business
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} />
          {/* Notification badge - can connect to pending requests count */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

        {/* Seller Avatar & Profile */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={seller?.logo_url} alt={seller?.business_name} />
            <AvatarFallback className="bg-brand text-white">
              {seller?.business_name?.charAt(0).toUpperCase() || "S"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800">
              {seller?.business_name || "Seller"}
            </p>
            <p className="text-xs text-gray-500">
              {seller?.total_listings || 0} listings
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          title="Logout"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
