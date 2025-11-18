import React from 'react';
import { usePremiumMode } from '../../shared/context/PremiumModeContext';
import ChatPage from './ChatPage';
import ChatPagePremium from './ChatPagePremium';

export const ChatPageWrapper: React.FC = () => {
  const { isPremiumMode } = usePremiumMode();
  
  console.log('[ChatPageWrapper] Premium mode:', isPremiumMode);
  
  return isPremiumMode ? <ChatPagePremium /> : <ChatPage />;
};

export default ChatPageWrapper;