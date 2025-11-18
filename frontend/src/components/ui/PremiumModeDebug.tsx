import React from 'react';
import { usePremiumMode } from '../../shared/context/PremiumModeContext';

export const PremiumModeDebug: React.FC = () => {
  const { isPremiumMode, togglePremiumMode } = usePremiumMode();
  
  return (
    <div className="fixed top-20 right-4 z-50 bg-gradient-to-br from-purple-600 to-pink-600 text-white p-4 rounded-lg shadow-lg">
      <div className="text-sm font-semibold">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isPremiumMode ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          Premium Mode: {isPremiumMode ? 'ON' : 'OFF'}
        </div>
        <button 
          onClick={togglePremiumMode}
          className="mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded text-xs hover:bg-white/30 transition-colors"
        >
          Toggle Mode
        </button>
        <div className="text-xs mt-1 opacity-75">Use Ctrl+P to toggle</div>
      </div>
    </div>
  );
};