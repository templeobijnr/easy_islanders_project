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
import { spacing } from '../../lib/spacing';
import type { ChatMessage } from './types';

// Define simple skeleton components using the base Skeleton
const ListItemSkeleton = () => <Skeleton className="h-10 w-full mb-2" />;
const CardSkeleton = () => <Skeleton className="h-32 w-full" />;

const ChatPage: React.FC = () => {
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
    results, // Add results to check state
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

  console.log('[ChatPage] State check:', {
    threadId,
    activeJob,
    messagesCount: messages.length,
    resultsCount: results.length,
    hasRecommendations: results.length > 0
  });

  // Connect to WebSocket for real-time updates
  const handleWsStatus = useCallback((status: 'connected' | 'disconnected' | 'connecting' | 'error') => {
    console.log('[ChatPage] WebSocket status change:', { from: connectionStatus, to: status, threadId });
    if (status === 'error' || status === 'disconnected') {
      console.warn('[ChatPage] WebSocket degraded:', { to: status, threadId });
    }
    setConnectionStatus(status);
  }, [setConnectionStatus, connectionStatus, threadId]);

  const handleWsMessage = useCallback((wsMessage: any) => {
    console.log('[ChatPage] WebSocket message received:', {
      type: wsMessage.type,
      event: wsMessage.event,
      thread_id: wsMessage.thread_id,
      payloadKeys: wsMessage?.payload ? Object.keys(wsMessage.payload) : [],
      hasRecommendations: !!wsMessage.payload?.rich?.recommendations,
      recommendationsCount: wsMessage.payload?.rich?.recommendations?.length || 0,
      hasInReplyTo: !!wsMessage?.meta?.in_reply_to,
    });
    if (wsMessage.type === 'chat_message' && wsMessage.event === 'assistant_message' && !wsMessage?.meta?.in_reply_to) {
      console.warn('[ChatPage] Assistant message missing in_reply_to; message may be dropped by context handler.');
    }
    // Handle server-side rehydration push on reconnect
    if (wsMessage.type === 'rehydration') {
      console.log('[Chat] Rehydration data received:', {
        rehydrated: wsMessage.rehydrated,
        domain: wsMessage.active_domain,
        intent: wsMessage.current_intent,
        turnCount: wsMessage.turn_count,
        summary: wsMessage.conversation_summary?.substring(0, 50),
      });
      // Store rehydration data in context (eliminates need for REST fetches)
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

  // Log connection config when component mounts
  useEffect(() => {
    console.log('[ChatPage] Mounted with:', {
      threadId,
      connectionStatus,
      wsEnabled: config.WEBSOCKET?.ENABLED,
      wsUrl: config.getWebSocketUrl?.()
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Convert Message[] to ChatMessage[]
  const chatMessages: ChatMessage[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role === 'agent' ? 'assistant' : msg.role,
    content: msg.text,
    ts: msg.ts,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* HIMS-INSPIRED HERO SECTION - Animated gradient with Playfair Display headline */}
      <div className="relative overflow-hidden px-4 sm:px-8 py-16 sm:py-24 text-center hero-gradient animate-gradient-flow">
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto stagger-children">
          {/* Badge pill with emoji */}
          <div className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full bg-white/90 border border-neutral-200 px-5 py-2.5 backdrop-blur-[10px] shadow-sm transition-transform duration-300 hover:scale-[1.02]">
            <span className="text-xl">🏝️</span>
            <span className="text-sm font-semibold text-primary font-sans">Discover North Cyprus</span>
          </div>

          {/* Playfair Display headline - 72px on desktop */}
          <h1 className="mb-4 sm:mb-6 display-hero text-foreground">
            <span className="block">Find everything you need</span>
            <span className="mt-2 block bg-gradient-to-r from-ocean-500 to-ocean-600 bg-clip-text text-transparent">
              in North Cyprus
            </span>
          </h1>

          {/* Clean subtitle */}
          <p className="mx-auto max-w-2xl body-large text-secondary">
            Find apartments, rent cars, buy electronics, book events — everything here
          </p>
        </div>
      </div>

      {/* AI ASSISTANT CHAT - Clean HIMS-inspired glass card design */}
      <AnimatedWrapper animation="fadeInUp" delay={0.2} className="max-w-4xl mx-auto px-4 sm:px-8 -mt-10">
        <section className="glass-card overflow-hidden flex flex-col relative shadow-[var(--shadow-card-hover)]">
          {/* Connection Status Badge - Clean positioning */}
          <div className="absolute top-4 right-4 z-10">
            <AnimatedWrapper animation="fadeInDown">
              <ConnectionStatus status={connectionStatus} />
            </AnimatedWrapper>
          </div>

          {/* Clean Chat Header */}
          <div className="bg-white/70 backdrop-blur-[10px] px-6 py-4 border-b border-[hsl(var(--sand-200))]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-[hsl(var(--ocean-100))] to-[hsl(var(--ocean-200))] flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[hsl(var(--sand-900))] font-[family:var(--font-heading)]">AI Assistant</h2>
                <p className="text-sm text-[hsl(var(--sand-600))] font-[family:var(--font-body)]">Always here to help you discover</p>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className={`flex-1 overflow-y-auto max-h-[40vh] ${spacing.listItemPadding} bg-white/80 backdrop-blur-[10px]`}>
            <StaggerContainer>
              <StaggerItem>
                {loading ? (
                  Array(3).fill(0).map((_, i) => <ListItemSkeleton key={i} />)
                ) : (
                  <ChatThread messages={chatMessages} />
                )}
              </StaggerItem>
            </StaggerContainer>

            {/* Typing Indicator */}
            {typing && (
              <div className="py-2">
                <AnimatedWrapper animation="fadeInUp">
                  <TypingDots />
                </AnimatedWrapper>
              </div>
            )}
          </div>

          {/* Recommendations Carousel - Clean horizontal cards */}
          <div className="px-6 py-4 bg-white/70 backdrop-blur-[10px] border-t border-[hsl(var(--sand-200))]">
            {loadingRecs ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-64">
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-[hsl(var(--sand-900))] font-[family:var(--font-heading)] flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  Personalized Recommendations
                </h3>
                <InlineRecsCarousel />
              </div>
            )}
          </div>

          {/* Clean Composer */}
          <div className="bg-white/80 backdrop-blur-[10px] border-t border-[hsl(var(--sand-200))]">
            <Composer />
          </div>
        </section>
      </AnimatedWrapper>

      {/* CATEGORY NAVIGATION - Clean Hims-inspired */}
      <AnimatedWrapper animation="fadeInUp" delay={0.3} className="px-8 mt-8">
        <CategoryCarousel />
      </AnimatedWrapper>

      {/* EXPLORE NORTH CYPRUS SECTION - Clean Hims-inspired layout */}
      <AnimatedWrapper animation="fadeInUp" delay={0.4} className="mt-12">
        <ExplorePage />
      </AnimatedWrapper>
    </div>
  );
};

export default ChatPage;
