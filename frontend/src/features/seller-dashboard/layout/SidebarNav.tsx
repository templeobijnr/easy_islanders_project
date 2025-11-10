import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { navItems } from "./NavItems";

export function SidebarNav() {
  const location = useLocation();

  return (
    <aside className="w-60 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 p-4 flex flex-col shadow-sm">
      <div className="text-xl font-bold mb-8 px-2 text-gray-800">
        Easy Islanders
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link key={item.name} to={item.path}>
              <Button
                variant={active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  active && "bg-brand text-white hover:bg-brand-dark"
                )}
              >
                <Icon size={18} />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer - User info or branding */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 px-2">
          Seller Dashboard v1.0
        </p>
      </div>
    </aside>
  );
}
