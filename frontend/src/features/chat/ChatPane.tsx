import React from 'react';
import { ChatHeader } from './components/ChatHeader';
import QuickActions from './components/QuickActions';
import { ChatThread } from './components/ChatThread';
import InlineRecsCarousel from './components/InlineRecsCarousel';
import Composer from './components/Composer';
import { useUi } from '../../shared/context/UiContext';
import { useChat } from '../../shared/context/ChatContext';
import type { ChatMessage } from './types';

export const ChatPane: React.FC = () => {
  const { activeJob } = useUi();
  const { messages, send } = useChat();

  // Convert Message[] to ChatMessage[]
  const chatMessages: ChatMessage[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role === 'agent' ? 'assistant' : msg.role,
    content: msg.text,
    ts: msg.ts,
  }));

  // Mock actions for QuickActions
  const actions = [
    { id: '1', label: 'Quick Action 1', onClick: () => {} },
    { id: '2', label: 'Quick Action 2', onClick: () => {} },
  ];

  return (
    <div className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 overflow-hidden">
      <ChatHeader />
      <QuickActions actions={actions} />
      <ChatThread messages={chatMessages} />
      {activeJob && <InlineRecsCarousel />}
      <Composer />
    </div>
  );
};