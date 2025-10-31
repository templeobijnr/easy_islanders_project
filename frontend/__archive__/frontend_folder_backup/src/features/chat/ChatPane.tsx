import React from 'react';
import ChatHeader from './components/ChatHeader';
import QuickActions from './components/QuickActions';
import ChatThread from './components/ChatThread';
import InlineRecsCarousel from './components/InlineRecsCarousel';
import Composer from './components/Composer';
import { useUi } from '../../shared/context/UiContext';
import { useChat } from './hooks/useChat';

export const ChatPane: React.FC = () => {
  const { activeJob } = useUi();
  const { messages, sendMessage } = useChat();
  const lastRecommendations = messages.length > 0 && messages[messages.length - 1].recommendations
    ? messages[messages.length - 1].recommendations!
    : [];
  return (
    <>
      <ChatHeader />
      <QuickActions actions={[]} />
      <ChatThread messages={messages} />
      {activeJob && (
        <InlineRecsCarousel
          recommendations={lastRecommendations as any}
          onSelectRecommendation={() => {}}
        />
      )}
      <Composer onSendMessage={sendMessage} />
    </>
  );
};