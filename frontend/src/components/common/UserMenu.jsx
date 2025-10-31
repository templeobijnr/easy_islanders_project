import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ClipboardList, CalendarDays, User, Settings, LogOut, ChevronDown } from 'lucide-react';

const UserMenu = ({ user, onLogout, unreadCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 focus:outline-none"
      >
        <div className="w-10 h-10 rounded-2xl bg-lime-600 flex items-center justify-center text-white font-semibold relative">
          {getInitials(user.username)}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <ChevronDown size={16} className="text-ink-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-lg py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="font-semibold text-ink-700">{user.username}</p>
            <p className="text-xs text-ink-500">{user.email}</p>
          </div>
          <nav className="py-1">
            <Link to="/messages" className="flex items-center gap-3 px-4 py-2.5 text-ink-700 hover:bg-slate-50 transition-colors relative">
              <MessageSquare size={18} />
              <span className="text-sm">Messages</span>
              {unreadCount > 0 && (
                <span className="ml-auto text-xs font-semibold text-red-500">{unreadCount}</span>
              )}
            </Link>
            <Link to="/requests" className="flex items-center gap-3 px-4 py-2.5 text-ink-700 hover:bg-slate-50 transition-colors">
              <ClipboardList size={18} />
              <span className="text-sm">My Requests</span>
            </Link>
            <Link to="/bookings" className="flex items-center gap-3 px-4 py-2.5 text-ink-700 hover:bg-slate-50 transition-colors">
              <CalendarDays size={18} />
              <span className="text-sm">Bookings</span>
            </Link>
          </nav>
          <div className="border-t border-slate-200 my-1"></div>
          <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-ink-700 hover:bg-slate-50 transition-colors">
            <User size={18} />
            <span className="text-sm">Profile</span>
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-ink-700 hover:bg-slate-50 transition-colors">
            <Settings size={18} />
            <span className="text-sm">Settings</span>
          </Link>
          <button
            onClick={onLogout}
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-ink-700 hover:bg-slate-50 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
