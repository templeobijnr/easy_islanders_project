import React from 'react';

export const ChatHeader: React.FC = () => {
  return (
    <div className="px-4 pt-4 pb-2 sticky top-0 bg-white/90 backdrop-blur rounded-t-2xl border-b border-slate-200 z-10">
      <div className="font-semibold text-ink-700">Chat</div>
    </div>
  );
};

export default ChatHeader;
