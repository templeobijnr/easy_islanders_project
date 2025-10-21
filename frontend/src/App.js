// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import EasyIslanders from './pages/EasyIslanders';
import CreateListing from './pages/CreateListing';
import Dashboard from './pages/dashboard/Dashboard';
import AuthModal from './components/auth/AuthModal';
import './index.css';

// Navigation Bar Component
function Navigation() {
  const location = useLocation();
  const { isAuthenticated, user, openAuthModal, handleLogout } = useAuth();

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
              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-800"
                  >
                    Logout
                  </button>
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                </>
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
  return (
    <div className="App min-h-screen bg-white flex flex-col">
      <Navigation />
      <AuthModal />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<EasyIslanders />} />
          <Route path="/create-listing" element={<CreateListing />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
