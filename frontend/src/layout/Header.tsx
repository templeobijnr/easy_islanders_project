import { Compass, MessageCircle, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import HeaderActions from '../components/common/HeaderActions';
import { useAuth } from '../shared/context/AuthContext';
import { useUi } from '../shared/context/UiContext';

export default function Header() {
  const loc = useLocation();
  const { isAuthenticated, user, unreadCount } = useAuth();
  const { toggleLeftRail } = useUi();

  const link = (to: string, label: string) => {
    const isActive = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-xl text-sm transition-colors ${
          isActive ? 'bg-lime-100 text-lime-700 font-medium' : 'text-ink-600 hover:bg-slate-100'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        {/* Logo + Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLeftRail}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-ink-600"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-lime-600 grid place-items-center">
              <Compass className="text-white w-5 h-5" />
            </div>
            <span className="font-semibold text-ink-700 text-lg">Easy Islanders</span>
          </Link>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {link('/', 'Chat')}
          {isAuthenticated && user?.user_type === 'business' && link('/create-listing', 'Create Listing')}
          {isAuthenticated && user?.user_type === 'business' && link('/dashboard', 'Dashboard')}

          <Link
            to="/messages"
            className="relative px-3 py-2 rounded-xl text-sm text-ink-600 hover:bg-slate-100 transition-colors"
          >
            <MessageCircle className="inline w-4 h-4 mr-1" /> Messages
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Right Actions */}
        <HeaderActions />
      </div>
    </header>
  );
}
