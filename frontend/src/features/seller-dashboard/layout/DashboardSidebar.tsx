import { Link, useLocation } from "react-router-dom";
import { cn } from "../../../lib/utils";
import { navItems } from "./NavItems";
import { X } from "lucide-react";

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isOpen = true, onClose }: DashboardSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-64 p-4 border border-slate-200 bg-white/90 backdrop-blur rounded-2xl sticky top-[88px] h-fit",
          "transform transition-transform duration-300 ease-in-out lg:transform-none",
          isOpen ? "fixed left-4 top-24 z-40" : "hidden lg:block"
        )}
      >
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden absolute top-2 right-2 p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        )}

        {/* Dashboard Header */}
        <div className="relative overflow-hidden rounded-xl mb-4 p-3 bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-lime-600 shadow-inner" />
            <div className="font-semibold">Seller Dashboard</div>
          </div>
          <div className="text-xs text-slate-700 mt-1">Manage your business</div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40" />
        </div>

        {/* Navigation */}
        <div className="text-xs text-slate-500 mb-2">Dashboard</div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => onClose?.()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-lime-100 text-lime-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-6 text-[11px] text-slate-500">
          Powered by Easy Islanders
        </div>
      </aside>
    </>
  );
}
