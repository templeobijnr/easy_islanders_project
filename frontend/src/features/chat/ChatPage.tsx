import React, { useCallback, useState, useEffect } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatThread } from './components/ChatThread';
import InlineRecsCarousel from './components/InlineRecsCarousel';
import Composer from './components/Composer';
import TypingDots from './components/TypingDots';
import ConnectionStatus from './components/ConnectionStatus';
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
    <AnimatedWrapper animation="fadeInUp" className="space-y-4">
      {/* CHAT SECTION - Top of main column */}
      <AnimatedWrapper animation="fadeInUp" delay={0.1}>
        <section className="bg-white/90 backdrop-blur rounded-2xl border border-border overflow-hidden flex flex-col">
          {/* Connection Status Badge */}
          <div className="absolute top-4 right-4 z-10">
            <AnimatedWrapper animation="fadeInDown">
              <ConnectionStatus status={connectionStatus} />
            </AnimatedWrapper>
          </div>

          <ChatHeader />
          <div className={`flex-1 overflow-y-auto max-h-[58vh] ${spacing.listItemPadding}`}>
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

            {(() => {
              console.log('[ChatPage] Carousel render condition:', {
                activeJob,
                hasActiveJob: !!activeJob,
                resultsLength: messages.length, // Check if we should show carousel
                willRenderCarousel: true // Always try to render, let carousel decide
              });
              // Always render carousel - it will handle empty state internally
              return loadingRecs ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : (
                <InlineRecsCarousel />
              );
            })()}
          </div>
          <Composer />
        </section>
      </AnimatedWrapper>

      {/* EXPLORE NORTH CYPRUS SECTION - Below chat in same column */}
      <AnimatedWrapper animation="fadeInUp" delay={0.2}>
        <ExplorePage />
      </AnimatedWrapper>
    </AnimatedWrapper>
  );
};

export default ChatPage;
