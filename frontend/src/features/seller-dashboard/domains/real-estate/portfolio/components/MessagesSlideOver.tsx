/**
 * MessagesSlideOver Component
 *
 * Slide-over panel for viewing and replying to messages for a specific listing
 */

import React, { useState } from 'react';
import { X, Send, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'owner';
  sender_name: string;
  sender_avatar?: string;
  timestamp: string;
  is_read: boolean;
}

interface MessageThread {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  last_message: Message;
  unread_count: number;
  messages: Message[];
}

interface MessagesSlideOverProps {
  listingId: string;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
  threads?: MessageThread[];
  isLoading?: boolean;
  onSendMessage?: (threadId: string, message: string) => Promise<void>;
}

export const MessagesSlideOver: React.FC<MessagesSlideOverProps> = ({
  listingId,
  listingTitle,
  isOpen,
  onClose,
  threads = [],
  isLoading = false,
  onSendMessage,
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedThreadId || !onSendMessage) return;

    setIsSending(true);
    try {
      await onSendMessage(selectedThreadId, replyText.trim());
      setReplyText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
      <div className="bg-white h-full w-full max-w-md shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-lime-50 to-emerald-50">
          <div className="flex-1">
            <button
              onClick={() => selectedThreadId ? setSelectedThreadId(null) : onClose()}
              className="text-slate-600 hover:text-slate-900 mb-2 flex items-center gap-2 text-sm"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h2 className="text-lg font-semibold text-slate-900 truncate">
              {selectedThread ? selectedThread.user.name : listingTitle}
            </h2>
            <p className="text-xs text-slate-600">
              {selectedThread ? 'Messages' : `${threads.length} conversation${threads.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-slate-500">Loading messages...</div>
            </div>
          ) : selectedThread ? (
            /* Thread View */
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedThread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'owner' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.sender === 'owner' ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender === 'user' && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                            {message.sender_avatar ? (
                              <img src={message.sender_avatar} alt={message.sender_name} className="w-full h-full rounded-full" />
                            ) : (
                              <User className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                        )}
                        <span className="text-xs font-medium text-slate-700">
                          {message.sender === 'owner' ? 'You' : message.sender_name}
                        </span>
                        <span className="text-xs text-slate-500">{formatTime(message.timestamp)}</span>
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-lg ${
                          message.sender === 'owner'
                            ? 'bg-lime-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isSending}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent
                             disabled:bg-slate-100"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!replyText.trim() || isSending}
                    className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700
                             disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors
                             flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Thread List */
            <div className="p-4 space-y-2">
              {threads.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-2">💬</div>
                  <p className="text-sm text-slate-600">No messages yet</p>
                </div>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-lg hover:border-lime-300 hover:bg-lime-50 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        {thread.user.avatar ? (
                          <img src={thread.user.avatar} alt={thread.user.name} className="w-full h-full rounded-full" />
                        ) : (
                          <User className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-slate-900">{thread.user.name}</h3>
                          {thread.unread_count > 0 && (
                            <span className="px-2 py-0.5 bg-lime-600 text-white text-xs font-semibold rounded-full">
                              {thread.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {thread.last_message.text}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatTime(thread.last_message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Example usage:
 *
 * <MessagesSlideOver
 *   listingId="listing-123"
 *   listingTitle="Kyrenia Beach Villa"
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   threads={[
 *     {
 *       id: 'thread-1',
 *       user: { name: 'John Doe', avatar: 'https://...' },
 *       last_message: {
 *         id: 'msg-1',
 *         text: 'Is this available...',
 *         sender: 'user',
 *         sender_name: 'John Doe',
 *         timestamp: '2024-11-15T10:30:00Z',
 *         is_read: false
 *       },
 *       unread_count: 2,
 *       messages: [...]
 *     }
 *   ]}
 *   onSendMessage={async (threadId, message) => {
 *     console.log('Sending:', message);
 *   }}
 * />
 */
