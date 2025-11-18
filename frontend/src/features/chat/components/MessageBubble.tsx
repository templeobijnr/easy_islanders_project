import React from 'react';
import { MotionDiv } from '../../../components/ui/motion-wrapper';

interface Props {
  role: 'user' | 'agent';
  text: string;
  typing?: boolean;
}

export const MessageBubble: React.FC<Props> = ({ role, text, typing }) => {
  const isAgent = role === 'agent';

  return (
    <MotionDiv
      className={`w-full flex ${isAgent ? 'justify-start' : 'justify-end'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <MotionDiv
        className={`max-w-[85%] text-sm p-3 rounded-2xl shadow-sm ${
          isAgent
            ? 'bg-card text-foreground border border-border'
            : 'bg-primary-500 text-primary-foreground'
        }`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {typing ? (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-300 animate-bounce [animation-delay:-0.2s]" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-300 animate-bounce" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-300 animate-bounce [animation-delay:0.2s]" />
            <span className="text-muted-foreground ml-2">Thinking…</span>
          </span>
        ) : (
          text
        )}
      </MotionDiv>
    </MotionDiv>
  );
};
