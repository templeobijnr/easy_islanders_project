import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
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
import '../index.css';

// Navigation Bar Component
function Navigation() {
  const location = useLocation();
  const { isAuthenticated, user, openAuthModal, handleLogout, unreadCount } = useAuth();

  const isCreateListingVisible = isAuthenticated && user?.user_type === 'business';
  const isDashboardVisible = isAuthenticated && user?.user_type === 'business';

  const linkStyles = "text-gray-700 font-semibold hover:text-brand transition-colors";
  const activeLinkStyles = "text-brand font-semibold";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 h-20 flex items-center">
      <div className="w-full mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo/Home Link */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center">
              <Compass className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-gray-800 hidden sm:inline">
              Easy Islanders
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="flex items-center gap-6">
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
            <div className="flex items-center gap-3 ml-4">
              {isAuthenticated && user ? (
                <UserMenu user={user} onLogout={handleLogout} unreadCount={unreadCount} />
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-sm font-semibold text-gray-700 hover:text-brand"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-full hover:bg-brand-dark transition-all duration-200 font-semibold text-sm"
                  >
                    <span>Sign Up</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Main App Component
function AppContent() {
  const { isAuthenticated, setUnreadCount } = useAuth();
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
          <Route path="/" element={<FeaturedPanel />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </div>
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