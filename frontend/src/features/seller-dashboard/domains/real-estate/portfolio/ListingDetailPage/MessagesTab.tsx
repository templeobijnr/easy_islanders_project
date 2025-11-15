/**
 * MessagesTab - Full-page messaging interface for a listing
 */

import React, { useState, useMemo } from 'react';
import { Search, Send, User, MoreVertical, Loader2 } from 'lucide-react';
import { useListingMessages } from '../hooks/useRealEstateData';
import type { Message as APIMessage } from '../services/realEstateApi';

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
    email?: string;
    avatar?: string;
  };
  last_message: Message;
  unread_count: number;
  messages: Message[];
}

interface MessagesTabProps {
  listingId: string;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({ listingId }) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch messages from API
  const {
    data: messagesData,
    isLoading,
    error,
  } = useListingMessages(listingId ? parseInt(listingId) : undefined);

  // Transform API messages into threads
  const threads = useMemo(() => {
    if (!messagesData?.results) return [];

    // Group messages by thread_id
    const threadMap = new Map<string, APIMessage[]>();
    messagesData.results.forEach((msg) => {
      const threadId = msg.thread_id;
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, []);
      }
      threadMap.get(threadId)!.push(msg);
    });

    // Convert to MessageThread format
    const transformedThreads: MessageThread[] = [];
    threadMap.forEach((msgs, threadId) => {
      // Sort messages by date
      const sortedMsgs = msgs.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const lastMessage = sortedMsgs[sortedMsgs.length - 1];
      const unreadCount = msgs.filter((m) => !m.is_read).length;

      transformedThreads.push({
        id: threadId,
        user: {
          name: `${lastMessage.sender.first_name} ${lastMessage.sender.last_name}`.trim() || 'Unknown User',
          email: lastMessage.sender.email,
        },
        last_message: {
          id: String(lastMessage.id),
          text: lastMessage.content,
          sender: 'user', // Assuming messages from API are from users
          sender_name: `${lastMessage.sender.first_name} ${lastMessage.sender.last_name}`.trim(),
          timestamp: lastMessage.created_at,
          is_read: lastMessage.is_read,
        },
        unread_count: unreadCount,
        messages: sortedMsgs.map((m) => ({
          id: String(m.id),
          text: m.content,
          sender: 'user' as const, // Assuming messages from API are from users
          sender_name: `${m.sender.first_name} ${m.sender.last_name}`.trim(),
          timestamp: m.created_at,
          is_read: m.is_read,
        })),
      });
    });

    return transformedThreads.sort((a, b) =>
      new Date(b.last_message.timestamp).getTime() - new Date(a.last_message.timestamp).getTime()
    );
  }, [messagesData]);

  // Auto-select first thread when data loads
  React.useEffect(() => {
    if (threads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  const selectedThread = threads.find(t => t.id === selectedThreadId);

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

  const handleSendMessage = () => {
    if (!replyText.trim()) return;
    // TODO: Implement send message API call
    console.log('Sending message:', replyText);
    setReplyText('');
  };

  const filteredThreads = threads.filter(thread =>
    thread.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lime-600 mx-auto" />
          <p className="mt-4 text-slate-700 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="max-w-md text-center p-8 bg-white rounded-2xl border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to Load Messages</h3>
          <p className="text-slate-600 text-sm">
            {error instanceof Error ? error.message : 'An error occurred while loading messages.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-350px)]">
      {/* Thread List */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <User className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900">No messages yet</p>
              <p className="text-xs text-slate-500 mt-1">Messages will appear here</p>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={`w-full p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left ${
                  selectedThreadId === thread.id ? 'bg-lime-50 border-l-4 border-l-lime-600' : ''
                }`}
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
                      <h3 className="font-semibold text-sm text-slate-900 truncate">{thread.user.name}</h3>
                      {thread.unread_count > 0 && (
                        <span className="px-2 py-0.5 bg-lime-600 text-white text-xs font-semibold rounded-full">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 truncate">{thread.last_message.text}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatTime(thread.last_message.timestamp)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message View */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-lime-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                  {selectedThread.user.avatar ? (
                    <img
                      src={selectedThread.user.avatar}
                      alt={selectedThread.user.name}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedThread.user.name}</h3>
                  <p className="text-xs text-slate-600">{selectedThread.user.email}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                <MoreVertical className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedThread.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'owner' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${message.sender === 'owner' ? 'order-2' : 'order-1'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-700">
                        {message.sender === 'owner' ? 'You' : message.sender_name}
                      </span>
                      <span className="text-xs text-slate-500">{formatTime(message.timestamp)}</span>
                    </div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        message.sender === 'owner'
                          ? 'bg-gradient-to-r from-lime-600 to-emerald-600 text-white'
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
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!replyText.trim()}
                  className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900">Select a conversation</p>
              <p className="text-xs text-slate-500 mt-1">Choose a conversation from the list to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
