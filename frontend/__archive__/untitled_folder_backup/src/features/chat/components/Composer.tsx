import React, { useRef, useEffect } from 'react';
import { Paperclip, Send } from '../../../shared/icons';
import { useChat } from '../../../shared/context/ChatContext';

const Composer: React.FC = () => {
  const { input, setInput, send, canSend, isLoading, onKeyDown } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 72)}px`; // Max 3 lines
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend && !isLoading) send();
    } else {
      onKeyDown(e);
    }
  };

  return (
    <div className="px-4 pt-2 sticky bottom-0 bg-white/80 backdrop-blur rounded-b-2xl z-10">
      <div className="flex items-center gap-2 p-2 border-2 border-slate-200 rounded-2xl focus-within:border-lime-400 bg-white">
        <button className="px-2 py-1 text-slate-500 rounded-lg hover:bg-slate-50" title="Attach" aria-label="Attach">
          <Paperclip size={18} />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything…"
          className="flex-1 outline-none text-sm placeholder:text-slate-400 resize-none leading-5 overflow-hidden"
          rows={1}
        />
        <button
          onClick={() => send()}
          disabled={!canSend || isLoading}
          className="px-3 py-1.5 rounded-xl bg-lime-600 text-white text-sm hover:bg-lime-700 disabled:opacity-50 inline-flex items-center gap-1"
          aria-label="Send"
        >
          <Send size={16} />
          Send
        </button>
      </div>
      <div className="text-[11px] text-slate-500 mt-1 mb-2">Tip: Try "/viewings Fri 18:00" or "/budget 2500".</div>
    </div>
  );
};

export default Composer;