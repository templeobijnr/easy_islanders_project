// frontend/src/App.js
import React, { useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'; // useLocation unused in Navigation now
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UiProvider } from './shared/context/UiContext';
import { ChatProvider } from './shared/context/ChatContext';
// import EasyIslanders from './pages/EasyIslanders'; // Archived to __archive__/EasyIslanders.jsx.bak
import ChatPage from './features/chat/ChatPage.tsx';
import CreateListing from './pages/CreateListing';
import Dashboard from './pages/dashboard/Dashboard';
import Messages from './pages/Messages'; // F.3 - Import Messages page
import Requests from './pages/Requests';   // F.3 - Import Requests page
import Bookings from './pages/Bookings';   // F.3 - Import Bookings page
import AuthModal from './components/auth/AuthModal';
import useAuthMigration from './hooks/useAuthMigration';
import UserMenu from './components/common/UserMenu'; // F.3 - Import UserMenu
import { useUnreadCount } from './hooks/useMessages'; // F.3 - Lift state up
import './index.css';

// Navigation Bar Component
function Navigation() {
  const location = useLocation();
  const { isAuthenticated, user, openAuthModal, handleLogout, unreadCount } = useAuth(); // Get unreadCount from context

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
                // F.3 - Use the new UserMenu component when authenticated
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
  const { isAuthenticated, setUnreadCount } = useAuth(); // Get setter for context
  useAuthMigration(isAuthenticated);
  const { unreadCount: fetchedCount } = useUnreadCount();
  // const location = useLocation(); // Currently unused
  // const searchParams = new URLSearchParams(location.search); // Removed - not used
  // const isNewUI = searchParams.get('newUI') === '1'; // Removed - now always using new UI

  useEffect(() => {
    setUnreadCount(fetchedCount);
  }, [fetchedCount, setUnreadCount]);

  return (
    <div className="App min-h-screen bg-white flex flex-col">
      <Navigation />
      <AuthModal />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/messages" element={<Messages />} /> {/* F.3 - Add Messages route */}
          <Route path="/requests" element={<Requests />} /> {/* F.3 - Add Requests route */}
          <Route path="/bookings" element={<Bookings />} /> {/* F.3 - Add Bookings route */}
          <Route path="/create-listing" element={<CreateListing />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

// App.js is now deprecated - use HomePage.tsx as the new entry point

export default AppContent;

