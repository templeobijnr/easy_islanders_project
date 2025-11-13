import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { AuthProvider, useAuth } from '../shared/context/AuthContext';
import DebugMemoryHUD from '../dev/DebugMemoryHUD';
import { useChat } from '../shared/context/ChatContext';
import { UiProvider } from '../shared/context/UiContext';
import { ChatProvider } from '../shared/context/ChatContext';
import AppShell from '../app/AppShell';
import ChatPage from '../features/chat/ChatPage';
import CreateListing from './CreateListing';
import Dashboard from './dashboard/Dashboard';
import Messages from './Messages';
import Requests from './Requests';
import Bookings from './Bookings';
import AuthModal from '../components/auth/AuthModal';
import useAuthMigration from '../hooks/useAuthMigration';
import UserMenu from '../components/common/UserMenu';
import { useUnreadCount } from '../hooks/useMessages';
import FeaturedPane from '../features/featured/FeaturedPane';
import FeaturedPanel from '../features/featured/FeaturedPanel';
import { Button } from '../components/ui/button';
import { PageTransition, AnimatedWrapper } from '../components/ui/animated-wrapper';
import { spacing } from '../lib/spacing';
import { Skeleton } from '../components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import '../index.css';

// Navigation Bar Component
function Navigation() {
  const location = useLocation();
  const { isAuthenticated, user, openAuthModal, handleLogout, unreadCount } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(false);
  }, []);

  const isCreateListingVisible = isAuthenticated && user?.user_type === 'business';
  const isDashboardVisible = isAuthenticated && user?.user_type === 'business';

  const linkStyles = "text-foreground font-semibold hover:text-primary transition-colors";
  const activeLinkStyles = "text-primary font-semibold";

  const AuthButtons = () => (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={() => openAuthModal('login')}>
            Sign In
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Sign in to your account</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="premium" onClick={() => openAuthModal('register')}>
            Sign Up
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create a new account</p>
        </TooltipContent>
      </Tooltip>
    </>
  );

  return (
    <AnimatedWrapper animation="fadeInDown">
      <header className="bg-background border-b border-border sticky top-0 z-40 h-20 flex items-center">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo/Home Link */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Compass className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:inline">
                Easy Islanders
              </span>
            </Link>

            {/* Navigation Links - Desktop */}
            <div className={`flex items-center ${spacing.buttonGroupGap}`}>
              <Link
                to="/"
                className={location.pathname === '/' ? activeLinkStyles : linkStyles}
              >
                Chat
              </Link>

              {isCreateListingVisible && (
                <Link
                  to="/create-listing"
                  className={location.pathname === '/create-listing' ? activeLinkStyles : linkStyles}
                >
                  Create Listing
                </Link>
              )}

              {isDashboardVisible && (
                <Link
                  to="/dashboard"
                  className={location.pathname.startsWith('/dashboard') ? activeLinkStyles : linkStyles}
                >
                  Dashboard
                </Link>
              )}

              {/* Auth Buttons */}
              <div className={`flex items-center ${spacing.buttonGroupGap} ml-4`}>
                {isLoading ? <Skeleton className="h-10 w-32" /> : (isAuthenticated ? <UserMenu user={user} onLogout={handleLogout} unreadCount={unreadCount} /> : <AuthButtons />)}
              </div>
            </div>
          </div>
        </div>
      </header>
    </AnimatedWrapper>
  );
}

// Main App Component
function AppContent() {
  const { isAuthenticated, setUnreadCount } = useAuth();
  const { dev_lastMemoryTrace, dev_lastCorrelationId } = useChat();
  const HUD_FLAG = (
    (import.meta as any)?.env?.VITE_DEBUG_MEMORY_HUD === 'true' ||
    (typeof process !== 'undefined' && (
      (process as any).env?.NEXT_PUBLIC_DEBUG_MEMORY_HUD === 'true' ||
      (process as any).env?.REACT_APP_DEBUG_MEMORY_HUD === 'true'
    ))
  );
  const [hudVisible, setHudVisible] = React.useState<boolean>(() => {
    if (!HUD_FLAG) return false;
    try {
      const sp = new URLSearchParams(window.location.search);
      const viaQuery = sp.get('debugHUD') === '1';
      const persisted = sessionStorage.getItem('debugHUD:visible') === 'true';
      return viaQuery || persisted;
    } catch (_) {
      return HUD_FLAG;
    }
  });

  // Restore persisted HUD visibility (session-only)
  React.useEffect(() => {
    if (!HUD_FLAG) return;
    try {
      const saved = sessionStorage.getItem('debugHUD:visible');
      if (saved !== null) setHudVisible(saved === 'true');
    } catch (_) {}
  }, [HUD_FLAG]);

  React.useEffect(() => {
    if (!HUD_FLAG) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      // Ignore when typing in inputs/textareas or contenteditable
      if (target && (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target as HTMLElement).isContentEditable
      )) {
        return;
      }
      if (mod && String(e.key).toLowerCase() === 'm') {
        // Prevent only when toggling HUD
        e.preventDefault();
        setHudVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [HUD_FLAG]);

  // Persist HUD visibility in sessionStorage
  React.useEffect(() => {
    if (!HUD_FLAG) return;
    try {
      sessionStorage.setItem('debugHUD:visible', String(hudVisible));
    } catch (_) {}
  }, [HUD_FLAG, hudVisible]);
  useAuthMigration(isAuthenticated);
  const { unreadCount: fetchedCount } = useUnreadCount();

  useEffect(() => {
    setUnreadCount(fetchedCount);
  }, [fetchedCount, setUnreadCount]);

  return (
    <div className="App min-h-screen bg-white flex flex-col">
      <Navigation />
      <AuthModal />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<PageTransition delay={0.1}><FeaturedPanel /></PageTransition>} />
          <Route path="/messages" element={<PageTransition delay={0.1}><Messages /></PageTransition>} />
          <Route path="/requests" element={<PageTransition delay={0.1}><Requests /></PageTransition>} />
          <Route path="/bookings" element={<PageTransition delay={0.1}><Bookings /></PageTransition>} />
          <Route path="/create-listing" element={<PageTransition delay={0.1}><CreateListing /></PageTransition>} />
          <Route path="/dashboard/*" element={<PageTransition delay={0.1}><Dashboard /></PageTransition>} />
        </Routes>
      </div>
      {HUD_FLAG && hudVisible && (
        <DebugMemoryHUD lastTrace={dev_lastMemoryTrace as any} correlationId={dev_lastCorrelationId} />
      )}
    </div>
  );
}

const HomePage: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <UiProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </UiProvider>
      </AuthProvider>
    </Router>
  );
};

export default HomePage;
