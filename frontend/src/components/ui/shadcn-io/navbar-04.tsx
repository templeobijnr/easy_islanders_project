"use client";
import React, { useState, useEffect } from "react";
import { AnimatePresence as FMAnimatePresence } from "framer-motion";

// Type-safe wrapper for AnimatePresence to fix TypeScript issues with framer-motion v11
const AnimatePresence = FMAnimatePresence as React.ComponentType<React.PropsWithChildren<{ mode?: "wait" | "sync" }>>;
import { MotionDiv, MotionButton } from "../motion-wrapper";
import { Menu, X, Compass, MessageCircle, LayoutDashboard, Plus, User, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../shared/context/AuthContext";
import UserMenu from "../../common/UserMenu.jsx";
import { Button } from "../button";
import { Skeleton } from "../skeleton";
import PillButton from "../pill-button";

export function Navbar04() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, openAuthModal, handleLogout, unreadCount } = useAuth();

  console.log('[Navbar04] Rendering:', { isAuthenticated, user: user?.email, unreadCount });

  // Detect scroll for glass morphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: "Chat", href: "/", icon: MessageCircle },
    { name: "Explore", href: "/explore", icon: Search },
    { name: "Messages", href: "/messages", icon: MessageCircle, showBadge: true },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, authRequired: true, businessOnly: true },
    { name: "Create Listing", href: "/listings/create", icon: Plus, authRequired: true, businessOnly: true },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const visibleNavigation = navigation.filter(item => {
    if (!item.authRequired) return true;
    if (!isAuthenticated) return false;
    if (item.businessOnly && user?.user_type !== 'business') return false;
    return true;
  });

  const AnimatePresence = FMAnimatePresence as any;

  return (
    <nav className={cn(
      "sticky top-0 z-50 transition-all duration-200",
      isScrolled
        ? "bg-white/80 backdrop-blur-[20px] border-b border-sand-200 shadow-lg"
        : "bg-transparent"
    )}>
      {/* Desktop Navigation */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <MotionDiv
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-ocean-500 to-ocean-600 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Compass className="w-6 h-6 text-white" />
              </MotionDiv>
              <span className="text-xl font-bold font-[family:var(--font-heading)] bg-gradient-to-r from-sand-900 to-sand-600 bg-clip-text text-transparent">
                Easy Islanders
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {visibleNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                >
                  <MotionDiv
                    className={cn(
                      "px-5 py-2.5 rounded-[var(--radius-lg)] font-semibold text-sm transition-all duration-200 flex items-center gap-2",
                      "font-[family:var(--font-body)]",
                      isActive(item.href)
                        ? "bg-ocean-500 text-white shadow-md"
                        : "bg-transparent text-sand-700 hover:bg-sand-100 hover:text-sand-900"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.showBadge && unreadCount > 0 && (
                      <span className="bg-sunset-500 text-white text-[10px] rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </MotionDiv>
                </Link>
              ))}
            </div>

            {/* Premium Toggle removed */}

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated && user ? (
                <UserMenu user={user} onLogout={handleLogout} unreadCount={unreadCount} />
              ) : (
                <div className="flex items-center space-x-2">
                  <PillButton variant="ghost" size="sm" onClick={() => openAuthModal?.('login')}>
                    Sign In
                  </PillButton>
                  <PillButton
                    variant="accent"
                    size="sm"
                    icon={<User className="w-4 h-4" />}
                    iconPosition="left"
                    onClick={() => openAuthModal?.('register')}
                  >
                    Sign Up
                  </PillButton>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <MotionButton
              className="md:hidden p-2.5 rounded-xl text-sand-700 hover:bg-sand-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </MotionButton>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MotionDiv
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-[20px] border-b border-sand-200 shadow-lg"
          >
            <div className="px-4 py-6 space-y-3">
              {visibleNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MotionDiv
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] font-semibold text-sm transition-all",
                      "font-[family:var(--font-body)]",
                      isActive(item.href)
                        ? "bg-ocean-500 text-white"
                        : "text-sand-700 hover:text-sand-900 hover:bg-sand-100"
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {item.showBadge && unreadCount > 0 && (
                      <span className="ml-auto bg-sunset-500 text-white text-[10px] rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </MotionDiv>
                </Link>
              ))}

              <div className="pt-4 border-t border-sand-200 space-y-2">
                {/* Premium Toggle for Mobile removed */}

                {!isAuthenticated ? (
                  <>
                    <PillButton
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        openAuthModal?.('login');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </PillButton>
                    <PillButton
                      variant="accent"
                      className="w-full"
                      icon={<User className="w-5 h-5" />}
                      iconPosition="left"
                      onClick={() => {
                        openAuthModal?.('register');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign Up
                    </PillButton>
                  </>
                ) : (
                  <div className="space-y-2 px-4">
                    <div className="text-sm text-sand-700 font-[family:var(--font-body)]">
                      Logged in as <span className="font-semibold text-sand-900">{user?.email}</span>
                    </div>
                    <PillButton
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        handleLogout?.();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Log Out
                    </PillButton>
                  </div>
                )}
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </nav>
  );
}
