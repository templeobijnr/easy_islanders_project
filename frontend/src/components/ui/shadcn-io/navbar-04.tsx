"use client";
import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MotionDiv, MotionButton } from "../motion-wrapper";
import { Menu, X, Compass, MessageCircle, LayoutDashboard, Plus, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../shared/context/AuthContext";
import UserMenu from "../../common/UserMenu.jsx";
import { Button } from "../button";
import { Skeleton } from "../skeleton";

export function Navbar04() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, openAuthModal, handleLogout, unreadCount } = useAuth();

  console.log('[Navbar04] Rendering:', { isAuthenticated, user: user?.email, unreadCount });

  const navigation = [
    { name: "Chat", href: "/", icon: MessageCircle },
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

  return (
    <nav className="relative z-50">
      {/* Desktop Navigation */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <MotionDiv
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Compass className="w-6 h-6 text-white" />
              </MotionDiv>
              <span className="text-xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
                Easy Islanders
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {visibleNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="relative group"
                >
                  <MotionDiv
                    className={cn(
                      "px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center space-x-2",
                      isActive(item.href)
                        ? "text-brand-600 bg-brand-50/80"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.showBadge && unreadCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </MotionDiv>
                  {isActive(item.href) && (
                    <MotionDiv
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 to-cyan-500"
                      layoutId="navbar-indicator"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated && user ? (
                <UserMenu user={user} onLogout={handleLogout} unreadCount={unreadCount} />
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={() => openAuthModal?.('login')}>
                    Sign In
                  </Button>
                  <MotionButton
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-cyan-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-shadow"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openAuthModal?.('register')}
                  >
                    <User className="w-4 h-4" />
                    <span>Sign Up</span>
                  </MotionButton>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <MotionButton
              className="md:hidden p-2.5 rounded-xl text-neutral-600 hover:bg-neutral-100/80 transition-colors"
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
            className="md:hidden overflow-hidden bg-white border-b border-neutral-200/50 shadow-lg"
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
                      "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all",
                      isActive(item.href)
                        ? "text-brand-600 bg-brand-50/80"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80"
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {item.showBadge && unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </MotionDiv>
                </Link>
              ))}

              <div className="pt-4 border-t border-neutral-200/50 space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        openAuthModal?.('login');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <MotionButton
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-brand-500 to-cyan-500 text-white rounded-xl font-semibold text-sm shadow-lg"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        openAuthModal?.('register');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <User className="w-5 h-5" />
                      <span>Sign Up</span>
                    </MotionButton>
                  </>
                ) : (
                  <div className="text-sm text-neutral-600 px-4">
                    Logged in as <span className="font-semibold">{user?.email}</span>
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
