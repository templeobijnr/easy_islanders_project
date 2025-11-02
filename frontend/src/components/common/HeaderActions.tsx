import React, { useState } from 'react';
import { Search, Settings } from 'lucide-react';
import UserMenu from './UserMenu';
import { useAuth } from '../../contexts/AuthContext';
import CommandPalette from './CommandPalette';
import SettingsModal from './SettingsModal';

export default function HeaderActions() {
  const { isAuthenticated, user, handleLogout, unreadCount, openAuthModal } = useAuth();
  const [openCmd, setOpenCmd] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Keyboard hints */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-ink-500">
          <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">/</span>
          <span>for commands</span>
          <span className="mx-1">•</span>
          <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">⌘K</span>
          <span>to search</span>
        </div>

        {/* Search button */}
        <button
          className="p-2 rounded-xl hover:bg-slate-100 text-ink-600"
          aria-label="Search"
          title="Search (⌘K)"
          onClick={() => setOpenCmd(true)}
        >
          <Search size={20} />
        </button>

        {/* Settings button */}
        <button
          className="p-2 rounded-xl hover:bg-slate-100 text-ink-600"
          aria-label="Settings"
          title="Settings"
          onClick={() => setOpenSettings(true)}
        >
          <Settings size={20} />
        </button>

        {/* User menu or login/signup */}
        {isAuthenticated && user ? (
          <UserMenu user={user} onLogout={handleLogout} unreadCount={unreadCount} />
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="text-sm text-ink-700 hover:text-lime-700"
              onClick={() => openAuthModal('login')}
            >
              Sign in
            </button>
            <button
              className="text-sm bg-lime-600 text-white px-4 py-2 rounded-full hover:bg-lime-700 transition-colors"
              onClick={() => openAuthModal('register')}
            >
              Sign up
            </button>
          </div>
        )}
      </div>

      <CommandPalette open={openCmd} onClose={setOpenCmd} />
      <SettingsModal open={openSettings} onClose={setOpenSettings} />
    </>
  );
}
