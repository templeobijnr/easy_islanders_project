import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Palette } from 'lucide-react';
import { usePremiumMode } from '../../shared/context/PremiumModeContext';

export const PremiumToggle: React.FC = () => {
  const { isPremiumMode, togglePremiumMode } = usePremiumMode();

  return (
    <motion.button
      onClick={togglePremiumMode}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
        transition-all duration-300 ease-in-out
        ${isPremiumMode 
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
          : 'bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200 hover:bg-white'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{ rotate: isPremiumMode ? 360 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {isPremiumMode ? <Sparkles className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
      </motion.div>
      <span className="hidden sm:inline">
        {isPremiumMode ? 'Premium' : 'Standard'}
      </span>
      <span className="sm:hidden">
        {isPremiumMode ? 'P' : 'S'}
      </span>
      
      {/* Premium indicator dot */}
      {isPremiumMode && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

export default PremiumToggle;