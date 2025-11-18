import React from 'react';
import { usePremiumMode } from '../../shared/context/PremiumModeContext';
import ExplorePage from './ExplorePage';
import PremiumExplorePage from './PremiumExplorePage';

export const ExplorePageWrapper: React.FC = () => {
  const { isPremiumMode } = usePremiumMode();
  
  console.log('[ExplorePageWrapper] Premium mode:', isPremiumMode);
  
  return isPremiumMode ? <PremiumExplorePage /> : <ExplorePage />;
};

export default ExplorePageWrapper;