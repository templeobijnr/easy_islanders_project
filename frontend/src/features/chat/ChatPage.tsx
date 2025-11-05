import React, { useCallback } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatThread } from './components/ChatThread';
import InlineRecsCarousel from './components/InlineRecsCarousel';
import Composer from './components/Composer';
import FeaturedPane from '../featured/FeaturedPane';
import { useUi } from '../../shared/context/UiContext';
import { useChat } from '../../shared/context/ChatContext';
import { useChatSocket } from 'shared/hooks/useChatSocket';
import type { ChatMessage } from './types';

const ChatPage: React.FC = () => {
  const { activeJob } = useUi();
  const {
    messages,
    threadId,
    pushAssistantMessage,
    setConnectionStatus,
    setTyping,
    wsCorrelationId,
    handleAssistantError,
  } = useChat();

  // Connect to WebSocket for real-time updates
  const handleWsMessage = useCallback((wsMessage: any) => {
    // Handle server-side rehydration push on reconnect
    if (wsMessage.type === 'rehydration') {
      console.log('[Chat] Rehydration data received:', {
        rehydrated: wsMessage.rehydrated,
        domain: wsMessage.active_domain,
        intent: wsMessage.current_intent,
        turnCount: wsMessage.turn_count,
        summary: wsMessage.conversation_summary?.substring(0, 50),
      });
      // TODO: Store rehydration data in context or state if needed
      // For now, just log it - the context is already restored server-side
      return;
    }

    if (wsMessage.type === 'chat_message' && wsMessage.event === 'assistant_message') {
      pushAssistantMessage(wsMessage);
      return;
    }
    if (wsMessage.type === 'chat_error') {
      handleAssistantError(wsMessage);
    }
  }, [pushAssistantMessage, handleAssistantError]);

  const handleWsError = useCallback((error: string) => {
    console.error('[Chat] WebSocket error:', error);
  }, []);

  useChatSocket(threadId, {
    onMessage: handleWsMessage,
    onStatus: setConnectionStatus,
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
    <div className="space-y-4">
      {/* CHAT SECTION - Top of main column */}
      <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        <ChatHeader />
        <div className="flex-1 overflow-y-auto px-4 max-h-[58vh]">
          <ChatThread messages={chatMessages} />
          {activeJob && <InlineRecsCarousel />}
        </div>
        <Composer />
      </section>

      {/* FEATURED/EXPLORE SECTION - Below chat in same column */}
      <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 overflow-hidden">
        <FeaturedPane />
      </section>
    </div>
  );
};

export default ChatPage;
