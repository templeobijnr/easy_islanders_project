import React from 'react';

interface Props {
  role: 'user' | 'agent';
  text: string;
  typing?: boolean;
}

export const MessageBubble: React.FC<Props> = ({ role, text, typing }) => {
  const isAgent = role === 'agent';
  return (
    <div className={`w-full flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] text-sm p-3 rounded-2xl ${
          isAgent ? 'bg-slate-100 text-slate-800' : 'bg-lime-100 text-slate-900'
        }`}
      >
        {typing ? (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
            <span className="text-slate-500 ml-2">Thinking…</span>
          </span>
        ) : (
          text
        )}
      </div>
    </div>
  );
};