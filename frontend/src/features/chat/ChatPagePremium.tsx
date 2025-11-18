import React, { useCallback, useState, useEffect } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatThread } from './components/ChatThread';
import InlineRecsCarousel from './components/InlineRecsCarousel';
import Composer from './components/Composer';
import TypingDots from './components/TypingDots';
import ConnectionStatus from './components/ConnectionStatus';
import HeroSection from './components/HeroSection';
import CategoryCarousel from './components/CategoryCarousel';
import { ExplorePage } from '../explore';
import { useUi } from '../../shared/context/UiContext';
import { useChat } from '../../shared/context/ChatContext';
import { useChatSocket } from '@/shared/hooks/useChatSocket';
import config from '@/config';
import { AnimatedWrapper, StaggerContainer, StaggerItem } from '../../components/ui/animated-wrapper';
import { Skeleton } from '../../components/ui/skeleton';
import type { ChatMessage } from './types';
import { motion, AnimatePresence as FMAnimatePresence } from 'framer-motion';

// Type-safe wrapper for AnimatePresence to fix TypeScript issues with framer-motion v11
const AnimatePresence = FMAnimatePresence as React.ComponentType<React.PropsWithChildren<{ mode?: "wait" | "sync" }>>;

// Define simple skeleton components using the base Skeleton
const ListItemSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const CardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
      <div className="aspect-video bg-gray-200 rounded-xl mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

const ChatPagePremium: React.FC = () => {
  const { activeJob } = useUi();
  const {
    messages,
    threadId,
    typing,
    connectionStatus,
    pushAssistantMessage,
    setConnectionStatus,
    setTyping,
    wsCorrelationId,
    handleAssistantError,
    setRehydrationData,
    results,
  } = useChat();

  // Add loading states for skeleton loaders
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Set loading to false when messages are available
  useEffect(() => {
    if (messages.length > 0) {
      setLoading(false);
    }
  }, [messages.length]);

  // Set loadingRecs to false when recommendations are available
  useEffect(() => {
    if (results.length > 0) {
      setLoadingRecs(false);
    }
  }, [results.length]);

  // Connect to WebSocket for real-time updates
  const handleWsStatus = useCallback((status: 'connected' | 'disconnected' | 'connecting' | 'error') => {
    setConnectionStatus(status);
  }, [setConnectionStatus]);

  const handleWsMessage = useCallback((wsMessage: any) => {
    // Handle server-side rehydration push on reconnect
    if (wsMessage.type === 'rehydration') {
      setRehydrationData({
        rehydrated: wsMessage.rehydrated,
        active_domain: wsMessage.active_domain,
        current_intent: wsMessage.current_intent,
        conversation_summary: wsMessage.conversation_summary,
        turn_count: wsMessage.turn_count,
        agent_contexts: wsMessage.agent_contexts,
        shared_context: wsMessage.shared_context,
        recent_turns: wsMessage.recent_turns,
        user_profile: wsMessage.user_profile,
      });
      return;
    }

    if (wsMessage.type === 'chat_message' && wsMessage.event === 'assistant_message') {
      pushAssistantMessage(wsMessage);
      return;
    }
    if (wsMessage.type === 'chat_error') {
      handleAssistantError(wsMessage);
    }
  }, [pushAssistantMessage, handleAssistantError, setRehydrationData]);

  const handleWsError = useCallback((error: string) => {
    console.error('[Chat] WebSocket error:', error);
  }, []);

  useChatSocket(threadId, {
    onMessage: handleWsMessage,
    onStatus: handleWsStatus,
    onError: handleWsError,
    onTyping: setTyping,
    correlationId: wsCorrelationId || undefined,
  });

  // Convert Message[] to ChatMessage[]
  const chatMessages: ChatMessage[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role === 'agent' ? 'assistant' : msg.role,
    content: msg.text,
    ts: msg.ts,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Premium Hero Section with Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden"
      >
        {/* Premium gradient background with subtle animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,113,133,0.05),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.05),transparent_50%)]" />
        </div>
        
        <div className="relative px-6 md:px-8 lg:px-12 py-16">
          <AnimatedWrapper animation="fadeInDown">
            <HeroSection />
          </AnimatedWrapper>
        </div>
      </motion.div>

      {/* Premium Category Carousel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        className="px-6 md:px-8 lg:px-12 -mt-8 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/40">
            <CategoryCarousel />
          </div>
        </div>
      </motion.div>

      {/* Premium Chat Interface */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="px-6 md:px-8 lg:px-12 py-12"
      >
        <div className="max-w-5xl mx-auto">
          {/* Premium Chat Container with Glassmorphism */}
          <div className="bg-card/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-ocean-900 via-ocean-800 to-ocean-900 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                  <h2 className="text-white font-semibold text-lg">AI Assistant</h2>
                </div>
                <div className="flex items-center gap-2">
                  <ConnectionStatus status={connectionStatus} />
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Premium Chat Messages Area */}
            <div className="h-[60vh] overflow-y-auto bg-gradient-to-b from-background/90 to-background/70">
              <div className="p-6 space-y-4">
                <AnimatePresence>
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {Array(3).fill(0).map((_, i) => (
                        <ListItemSkeleton key={i} />
                      ))}
                    </motion.div>
                  ) : (
                    <ChatThread messages={chatMessages} />
                  )}
                </AnimatePresence>

                {/* Premium Typing Indicator */}
                <AnimatePresence>
                  {typing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center gap-2 text-muted-foreground text-sm"
                    >
                      <TypingDots />
                      <span>AI is thinking...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Premium Recommendations Section */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border bg-gradient-to-b from-background/50 to-background/30 p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Recommendations</h3>
                    <p className="text-sm text-muted-foreground">Based on your conversation</p>
                  </div>
                  {loadingRecs ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array(3).fill(0).map((_, i) => (
                        <CardSkeleton key={i} />
                      ))}
                    </div>
                  ) : (
                    <InlineRecsCarousel />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium Composer */}
            <div className="border-t border-border bg-background/80 backdrop-blur-sm">
              <Composer />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Premium Explore Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="px-6 md:px-8 lg:px-12 py-16 bg-gradient-to-b from-white to-slate-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              Discover North Cyprus
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              From stunning properties to unforgettable experiences, find your perfect match in our island paradise
            </motion.p>
          </div>
          <ExplorePage />
        </div>
      </motion.div>
    </div>
  );
};

export default ChatPagePremium;
