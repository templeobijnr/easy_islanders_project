import React, { useState, useEffect } from 'react';
import { useUnreadCount } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { Send } from 'lucide-react';
import api from '../api';
import axios from 'axios';
import config from '../config';

const MessageView = ({ threadId, fetchUnreadCount }) => {
  if (!threadId) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 h-full">
        <h2 className="text-xl font-semibold text-gray-700">Select a conversation</h2>
        <p className="text-gray-500 mt-2">Choose from your existing conversations to start chatting.</p>
      </div>
    );
  }
  // Placeholder for detailed thread view; existing chat flow handles message send.
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-gray-500 text-sm">Thread: {threadId}</div>
      </div>
      <div className="p-4 border-t bg-white">
        <div className="relative">
          <input 
            type="text"
            placeholder="Type a message..."
            className="w-full pl-4 pr-12 py-3 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Messages = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { fetchUnreadCount } = useUnreadCount();

  const loadThreads = async (pageNum = 1) => {
    try {
      setLoading(true);
      const data = await api.getThreads(pageNum, 20);
      setThreads(prev => (pageNum === 1 ? data.results : [...prev, ...data.results]));
      setHasNext(data.has_next);
      setPage(data.page);
      setError(null);
    } catch (e) {
      setError('Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  // Mark thread as read on selection
  useEffect(() => {
    const markSelectedThreadRead = async () => {
      if (!activeThreadId) return;
      try {
        await axios.post(config.getApiUrl(config.ENDPOINTS.MESSAGES.MARK_READ(activeThreadId)));
        // Refresh unread badge and reload first page to update counts
        fetchUnreadCount();
        loadThreads(1);
      } catch (e) {
        // No-op; user experience should not break on mark-read failures
      }
    };
    markSelectedThreadRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  useEffect(() => {
    loadThreads(1);
  }, []);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Thread List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && threads.length === 0 && (
            <div className="p-4 text-gray-500">Loading conversations...</div>
          )}
          {error && (
            <div className="p-4 text-red-500">{error}</div>
          )}
          {threads.map(thread => (
            <div 
              key={thread.thread_id} 
              className={`p-4 border-b hover:bg-gray-100 cursor-pointer flex items-center ${activeThreadId === thread.thread_id ? 'bg-blue-50' : ''}`}
              onClick={() => setActiveThreadId(thread.thread_id)}
            >
              <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-semibold">{thread.participants?.[0]?.name || 'Conversation'}</p>
                  <p className="text-sm text-gray-500">{new Date(thread.updated_at).toLocaleString()}</p>
                </div>
                <p className="text-sm text-gray-600 truncate">{thread.last_message?.content || ''}</p>
              </div>
              {thread.unread_count > 0 && (
                <div className="ml-4 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {thread.unread_count > 9 ? '9+' : thread.unread_count}
                </div>
              )}
            </div>
          ))}
          {hasNext && (
            <button 
              onClick={() => loadThreads(page + 1)}
              className="w-full py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      </div>

      {/* Message View */}
      <div className="w-2/3 flex flex-col">
        <MessageView threadId={activeThreadId} fetchUnreadCount={fetchUnreadCount} />
      </div>
    </div>
  );
};

export default Messages;
