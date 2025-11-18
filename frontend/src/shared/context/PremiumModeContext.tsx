import React, { createContext, useContext, useState, useEffect } from 'react';

interface PremiumModeContextType {
  isPremiumMode: boolean;
  setPremiumMode: (premium: boolean) => void;
  togglePremiumMode: () => void;
}

const PremiumModeContext = createContext<PremiumModeContextType | undefined>(undefined);

export const PremiumModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremiumMode, setIsPremiumMode] = useState<boolean>(() => {
    // Check localStorage for saved preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('premiumMode');
      console.log('[PremiumModeContext] Initializing premium mode from localStorage:', saved);
      return saved === 'true';
    }
    console.log('[PremiumModeContext] Initializing premium mode: false (default)');
    return false;
  });

  const setPremiumMode = (premium: boolean) => {
    setIsPremiumMode(premium);
    if (typeof window !== 'undefined') {
      localStorage.setItem('premiumMode', String(premium));
    }
  };

  const togglePremiumMode = () => {
    const newMode = !isPremiumMode;
    console.log('[PremiumModeContext] Toggling premium mode from', isPremiumMode, 'to', newMode);
    setPremiumMode(newMode);
  };

  useEffect(() => {
    // Add a keyboard shortcut Ctrl/Cmd + P to toggle premium mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        togglePremiumMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPremiumMode]);

  return (
    <PremiumModeContext.Provider value={{
      isPremiumMode,
      setPremiumMode,
      togglePremiumMode
    }}>
      {children}
    </PremiumModeContext.Provider>
  );
};

export const usePremiumMode = () => {
  const context = useContext(PremiumModeContext);
  if (context === undefined) {
    throw new Error('usePremiumMode must be used within a PremiumModeProvider');
  }
  return context;
};