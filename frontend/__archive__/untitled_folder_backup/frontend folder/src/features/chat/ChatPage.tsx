import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppShell from '../../app/AppShell.tsx';
import ChatHeader from './components/ChatHeader.tsx';
import ChatThread from './components/ChatThread.tsx';
import Composer from './components/Composer.tsx';
import QuickActions from './components/QuickActions.tsx';
import InlineRecsCarousel from './components/InlineRecsCarousel.tsx';
import { useChat } from './hooks/useChat.ts';

const ChatPage = () => {
  const { messages, isTyping, error, sendMessage, clearError } = useChat();


  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const quickActions = [
    { id: 'properties', label: 'Find Properties', onClick: () => handleSendMessage('I want to find properties in Cyprus') },
    { id: 'investment', label: 'Investment Advice', onClick: () => handleSendMessage('Tell me about investing in Cyprus real estate') },
    { id: 'areas', label: 'Popular Areas', onClick: () => handleSendMessage('What are the most popular areas in Cyprus?') },
    { id: 'guide', label: 'Buying Guide', onClick: () => handleSendMessage('Guide me through buying property in Cyprus') },
  ];

  // Get recommendations from the latest assistant message
  const latestAssistantMessage = messages.filter(m => m.sender === 'assistant').pop();
  const recommendations = latestAssistantMessage?.recommendations || [];

  return (
    <AppShell
      header={<ChatHeader />}
      composer={<Composer onSendMessage={handleSendMessage} />}
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <ChatThread messages={messages} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <QuickActions actions={quickActions} />
          </motion.div>
        )}

        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <InlineRecsCarousel
              recommendations={recommendations}
              onSelectRecommendation={(rec) => handleSendMessage(`Tell me more about ${rec.title}`)}
            />
          </motion.div>
        )}
      </div>
    </AppShell>
  );
};

export default ChatPage;