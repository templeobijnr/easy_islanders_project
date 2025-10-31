import React from 'react';
import AppShell from '../../app/AppShell';
import { ChatHeader } from './components/ChatHeader';
import { ChatThread } from './components/ChatThread';
import InlineRecsCarousel from './components/InlineRecsCarousel';
import Composer from './components/Composer';
import FeaturedPane from '../featured/FeaturedPane';
import { useUi } from '../../shared/context/UiContext';
import { useChat } from '../../shared/context/ChatContext';
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

  // Mock recommendations for InlineRecsCarousel
  const recommendations = [
    { id: '1', title: 'Recommendation 1', description: 'Description 1' },
    { id: '2', title: 'Recommendation 2', description: 'Description 2' },
  ];

  const handleSelectRecommendation = (rec: any) => {
    // Handle recommendation selection
  };

  return (
    <AppShell>
      {/* Chat section */}
      <div className="pt-3">
        <ChatHeader />
        <div className="px-4">
          <ChatThread messages={chatMessages} />
          {activeJob && <InlineRecsCarousel recommendations={recommendations} onSelectRecommendation={handleSelectRecommendation} />}
        </div>
        <Composer />
      </div>

      {/* Featured section */}
      <FeaturedPane />
    </AppShell>
  );
};

export default ChatPage;