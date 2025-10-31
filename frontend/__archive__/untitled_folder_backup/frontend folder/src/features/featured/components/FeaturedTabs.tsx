import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface FeaturedTabsProps {
  tabs: Tab[];
  defaultActiveTab?: string;
}

const FeaturedTabs = ({ tabs, defaultActiveTab }: FeaturedTabsProps) => {
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('featuredTabs_activeTab');
    return stored || defaultActiveTab || tabs[0]?.id;
  });

  useEffect(() => {
    localStorage.setItem('featuredTabs_activeTab', activeTab);
  }, [activeTab]);

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-md rounded-2xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-soft'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tabs.map((tab) => (
          activeTab === tab.id && (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {tab.content}
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FeaturedTabs;