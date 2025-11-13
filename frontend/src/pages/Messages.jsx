import React, { useState, useEffect } from 'react';
import { useUnreadCount } from '../hooks/useMessages';
// import { useAuth } from '../contexts/AuthContext'; // Unused
import { Send, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { PageTransition, StaggerContainer, StaggerItem, AnimatedWrapper } from '../components/ui/animated-wrapper';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { spacing } from '../lib/spacing';
import api, { http } from '../api';
import config from '../config';

const MessageView = ({ threadId, fetchUnreadCount }) => {
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (threadId) {
      setLoadingMessages(true);
      // Simulate message loading (replace with actual API call)
      setTimeout(() => setLoadingMessages(false), 1000);
    }
  }, [threadId]);

  if (!threadId) {
    return (
      <AnimatedWrapper animation="scaleIn">
        <div className="flex flex-col items-center justify-center text-center p-8 h-full">
          <h2 className="text-xl font-semibold text-foreground">Select a conversation</h2>
          <p className="text-muted-foreground mt-2">Choose from your existing conversations to start chatting.</p>
        </div>
      </AnimatedWrapper>
    );
  }
  // Placeholder for detailed thread view; existing chat flow handles message send.
  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 overflow-y-auto ${spacing.listItemPadding} ${spacing.listGap}`}>
        {loadingMessages ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : (
          <AnimatedWrapper animation="fadeInUp" duration={0.2}>
            <div className="text-muted-foreground text-sm">Thread: {threadId}</div>
          </AnimatedWrapper>
        )}
      </div>
      <div className={`${spacing.listItemPadding} border-t bg-background`}>
        <div className="relative">
          <Input
            type="text"
            placeholder="Type a message..."
            className="w-full pl-4 pr-12 py-3 border rounded-full bg-muted focus:scale-105 transition-transform"
          />
          <Button
            variant="premium"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const Messages = () => {
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
      const token = localStorage.getItem('token');
      if (!token) {
        setThreads([]);
        setHasNext(false);
        setPage(1);
        setError(null);
        return;
      }
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
      const token = localStorage.getItem('token');
      if (!activeThreadId || !token) return;
      try {
        await http.put(config.ENDPOINTS.MESSAGES.MARK_READ(activeThreadId), { mark_as_read: true });
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
    <PageTransition>
      <div className="flex h-full bg-background">
        {/* Thread List */}
        <div className="w-1/3 border-r border-border flex flex-col">
          <div className={spacing.listItemPadding + " border-b"}>
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && threads.length === 0 && (
              <div className={spacing.listItemPadding}>
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)}
              </div>
            )}
            {error && (
              <div className={`${spacing.listItemPadding} text-destructive`}>{error}</div>
            )}
            <StaggerContainer>
              {threads.map(thread => (
                <StaggerItem key={thread.thread_id}>
                  <div
                    className={`${spacing.listItemPadding} border-b hover:bg-accent cursor-pointer flex items-center ${activeThreadId === thread.thread_id ? 'bg-primary/10' : ''}`}
                    onClick={() => setActiveThreadId(thread.thread_id)}
                  >
                    <div className="w-12 h-12 rounded-full bg-muted mr-4"></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-semibold">{thread.participants?.[0]?.name || 'Conversation'}</p>
                        <p className="text-sm text-muted-foreground">{new Date(thread.updated_at).toLocaleString()}</p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{thread.last_message?.content || ''}</p>
                    </div>
                    {thread.unread_count > 0 && (
                      <div className="ml-4 w-6 h-6 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {thread.unread_count > 9 ? '9+' : thread.unread_count}
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
            {hasNext && (
              <Button
                onClick={() => loadThreads(page + 1)}
                disabled={loading}
                variant="ghost"
                className="w-full"
              >
                {loading ? <><Loader2 className="animate-spin mr-2" />Loading...</> : 'Load More'}
              </Button>
            )}
          </div>
        </div>

        {/* Message View */}
        <div className="w-2/3 flex flex-col">
          <MessageView threadId={activeThreadId} fetchUnreadCount={fetchUnreadCount} />
        </div>
      </div>
    </PageTransition>
  );
};

export default Messages;
