import React from 'react';
import { motion } from 'framer-motion';
import AppShell from '../../app/AppShell';
import Spotlight from './components/Spotlight';
import FeaturedTabs from './components/FeaturedTabs';
import LargeCardGrid from './components/LargeCardGrid';
import Lane from './components/Lane';
import TrustStrip from './components/TrustStrip';
import { SPOTLIGHT_ITEMS, FEATURED_PROPERTIES, POPULAR_AREAS } from './constants';

const FeaturedPanel = () => {
  // Use constants from the dedicated file - ready for backend integration
  const spotlightItems = SPOTLIGHT_ITEMS;
  const featuredProperties = FEATURED_PROPERTIES;
  const popularAreas = POPULAR_AREAS;

  const tabs = [
    {
      id: 'properties',
      label: 'Properties',
      content: (
        <div className="space-y-8">
          <LargeCardGrid items={featuredProperties} />
          <Lane title="Popular Areas" items={popularAreas} />
        </div>
      ),
    },
    {
      id: 'services',
      label: 'Services',
      content: (
        <div className="text-center py-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Services</h3>
          <p className="text-slate-600">Comprehensive real estate services tailored for you.</p>
        </div>
      ),
    },
    {
      id: 'guides',
      label: 'Guides',
      content: (
        <div className="text-center py-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Buying Guide</h3>
          <p className="text-slate-600">Everything you need to know about buying property in Cyprus.</p>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-12 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Spotlight items={spotlightItems} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <FeaturedTabs tabs={tabs} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <TrustStrip />
        </motion.div>
      </div>
    </AppShell>
  );
};

export default FeaturedPanel;