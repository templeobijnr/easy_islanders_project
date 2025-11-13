import React, { useState, useEffect } from 'react';
import { Navbar04 } from '../components/ui/shadcn-io/navbar-04';
import AuthModal from '../components/auth/AuthModal';
import DebugMemoryHUD from '../dev/DebugMemoryHUD';
import { useChat } from '../shared/context/ChatContext';
import { useAuth } from '../shared/context/AuthContext';
import useAuthMigration from '../hooks/useAuthMigration';
import { useUnreadCount } from '../hooks/useMessages';

type Props = { children: React.ReactNode };

/**
 * Main Application Shell
 * Provides consistent layout with navbar and main content area
 */
export const AppShell: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, setUnreadCount } = useAuth();
  const { dev_lastMemoryTrace, dev_lastCorrelationId } = useChat();

  // Debug HUD feature flag and state
  const HUD_FLAG = (
    (import.meta as any)?.env?.VITE_DEBUG_MEMORY_HUD === 'true' ||
    (typeof process !== 'undefined' && (
      (process as any).env?.NEXT_PUBLIC_DEBUG_MEMORY_HUD === 'true' ||
      (process as any).env?.REACT_APP_DEBUG_MEMORY_HUD === 'true'
    ))
  );

  const [hudVisible, setHudVisible] = useState<boolean>(() => {
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
  useEffect(() => {
    if (!HUD_FLAG) return;
    try {
      const saved = sessionStorage.getItem('debugHUD:visible');
      if (saved !== null) setHudVisible(saved === 'true');
    } catch (_) {}
  }, [HUD_FLAG]);

  // Keyboard shortcut: Cmd/Ctrl+M to toggle HUD
  useEffect(() => {
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
        e.preventDefault();
        setHudVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [HUD_FLAG]);

  // Persist HUD visibility in sessionStorage
  useEffect(() => {
    if (!HUD_FLAG) return;
    try {
      sessionStorage.setItem('debugHUD:visible', String(hudVisible));
    } catch (_) {}
  }, [HUD_FLAG, hudVisible]);

  // Auth migration for legacy tokens
  useAuthMigration(isAuthenticated);

  // Sync unread message count
  const { unreadCount: fetchedCount } = useUnreadCount();
  useEffect(() => {
    setUnreadCount(fetchedCount);
  }, [fetchedCount, setUnreadCount]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar04 />

      {/* Auth Modal */}
      <AuthModal />

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>

      {/* Debug HUD (dev only, toggle with Cmd/Ctrl+M) */}
      {HUD_FLAG && hudVisible && (
        <DebugMemoryHUD
          lastTrace={dev_lastMemoryTrace as any}
          correlationId={dev_lastCorrelationId}
        />
      )}
    </div>
  );
};

export default AppShell;