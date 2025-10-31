import React from 'react';
import LeftRail from '../left-rail/LeftRail';
import { ChatHeader } from './components/ChatHeader';
import { ChatThread } from './components/ChatThread';
import InlineRecsCarousel from './components/InlineRecsCarousel';
import Composer from './components/Composer';
import FeaturedPane from '../featured/FeaturedPane';
import { useUi } from 'shared/context/UiContext';
import { useChat } from 'shared/context/ChatContext';
import type { ChatMessage } from './types';

const ChatPage: React.FC = () => {
  const { activeJob } = useUi();
  const { messages } = useChat();

  // Convert Message[] to ChatMessage[]
  const chatMessages: ChatMessage[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role === 'agent' ? 'assistant' : msg.role,
    content: msg.text,
    ts: msg.ts,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
      {/* LEFT RAIL */}
      <LeftRail />

      {/* MAIN CONTENT: Chat + Featured stacked vertically */}
      <div className="flex flex-col gap-6">
        {/* CHAT SECTION */}
        <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <ChatHeader />
          <div className="flex-1 overflow-y-auto px-4">
            <ChatThread messages={chatMessages} />
            {activeJob && <InlineRecsCarousel />}
          </div>
          <Composer />
        </section>

        {/* FEATURED SECTION - Full width below chat */}
        <section>
          <FeaturedPane />
        </section>
      </div>
    </div>
  );
};

export default ChatPage;