import { Link, useLocation } from "react-router-dom";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { navItems } from "./NavItems";
import { X } from "lucide-react";

interface SidebarNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function SidebarNav({ isOpen = true, onClose }: SidebarNavProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-60 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 p-4 flex flex-col shadow-sm z-40",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Mobile close button */}
        {onClose && (
          <div className="lg:hidden flex justify-end mb-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        <div className="text-xl font-bold mb-8 px-2 text-gray-800">
          Easy Islanders
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => onClose?.()}
              >
                <Button
                  variant={active ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 text-sm",
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
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 px-2">
            Seller Dashboard v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
