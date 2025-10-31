import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Calendar, Briefcase, User, Settings, LogOut, ChevronDown } from 'lucide-react';

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
    return null; // Or render a login button
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
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold relative">
          {getInitials(user.username)}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <ChevronDown size={20} className="text-gray-600" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b">
            <p className="font-semibold">{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <nav className="mt-2">
            <Link to="/messages" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 relative">
              <MessageSquare size={20} className="mr-3" />
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="ml-auto text-sm font-bold text-red-500">{unreadCount}</span>
              )}
            </Link>
            <Link to="/requests" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
              <Briefcase size={20} className="mr-3" />
              <span>My Requests</span>
            </Link>
            <Link to="/bookings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
              <Calendar size={20} className="mr-3" />
              <span>Bookings</span>
            </Link>
          </nav>
          <div className="border-t my-2"></div>
          <Link to="/profile" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <User size={20} className="mr-3" />
            <span>Profile</span>
          </Link>
          <Link to="/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <Settings size={20} className="mr-3" />
            <span>Settings</span>
          </Link>
          <button 
            onClick={onLogout} 
            className="w-full text-left flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <LogOut size={20} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
