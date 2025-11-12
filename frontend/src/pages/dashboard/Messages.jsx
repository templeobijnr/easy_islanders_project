import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Send,
  Star,
  Paperclip,
  Smile,
  Phone,
  Video,
  Info,
  CheckCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, starred

  useEffect(() => {
    // Mock messages data with conversations
    const mockConversations = [
      {
        id: 1,
        sender: { name: 'John Doe', avatar: 'JD', email: 'john@example.com', online: true },
        listing: 'iPhone 12 Pro Max',
        lastMessage: 'Is this still available? I am very interested!',
        timestamp: '2025-10-21T10:30:00',
        unread: true,
        starred: false,
        messages: [
          { id: 1, sender: 'them', text: 'Hi! Is this still available?', time: '10:20 AM' },
          { id: 2, sender: 'me', text: 'Yes, it is! Would you like to schedule a viewing?', time: '10:25 AM' },
          { id: 3, sender: 'them', text: 'Is this still available? I am very interested!', time: '10:30 AM' }
        ]
      },
      {
        id: 2,
        sender: { name: 'Jane Smith', avatar: 'JS', email: 'jane@example.com', online: false },
        listing: 'MacBook Pro M3',
        lastMessage: 'Thanks for the quick response! When can I pick it up?',
        timestamp: '2025-10-21T09:15:00',
        unread: true,
        starred: true,
        messages: [
          { id: 1, sender: 'them', text: 'Can you provide more details about the specs?', time: '9:00 AM' },
          { id: 2, sender: 'me', text: 'Sure! It has M3 Pro chip, 16GB RAM, 512GB SSD', time: '9:10 AM' },
          { id: 3, sender: 'them', text: 'Thanks for the quick response! When can I pick it up?', time: '9:15 AM' }
        ]
      },
      {
        id: 3,
        sender: { name: 'Mike Johnson', avatar: 'MJ', email: 'mike@example.com', online: false },
        listing: 'Apartment in Valletta',
        lastMessage: 'Thanks for the information!',
        timestamp: '2025-10-20T14:45:00',
        unread: false,
        starred: false,
        messages: [
          { id: 1, sender: 'them', text: 'Is the apartment pet-friendly?', time: 'Yesterday' },
          { id: 2, sender: 'me', text: 'Yes, small pets are allowed with a deposit', time: 'Yesterday' },
          { id: 3, sender: 'them', text: 'Thanks for the information!', time: 'Yesterday' }
        ]
      },
      {
        id: 4,
        sender: { name: 'Sarah Williams', avatar: 'SW', email: 'sarah@example.com', online: true },
        listing: 'Vintage Camera Collection',
        lastMessage: 'Can I see more photos?',
        timestamp: '2025-10-19T16:20:00',
        unread: false,
        starred: true,
        messages: [
          { id: 1, sender: 'them', text: 'Beautiful collection! Are they all working?', time: '2 days ago' },
          { id: 2, sender: 'me', text: 'Yes, all fully functional and tested', time: '2 days ago' },
          { id: 3, sender: 'them', text: 'Can I see more photos?', time: '2 days ago' }
        ]
      }
    ];
    setMessages(mockConversations);
    setLoading(false);
  }, []);

  const filteredMessages = messages.filter(msg => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && msg.unread) ||
      (filter === 'starred' && msg.starred);

    const matchesSearch =
      !searchQuery ||
      msg.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.listing.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = messages.filter(m => m.unread).length;
  const starredCount = messages.filter(m => m.starred).length;

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage = {
      id: selectedConversation.messages.length + 1,
      sender: 'me',
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prevMessages =>
      prevMessages.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, messages: [...conv.messages, newMessage], lastMessage: messageInput }
          : conv
      )
    );

    setSelectedConversation(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    setMessageInput('');
  };

  const toggleStar = (id) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === id ? { ...msg, starred: !msg.starred } : msg
      )
    );
  };

  const markAsRead = (id) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === id ? { ...msg, unread: false } : msg
      )
    );
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  if (loading) {
    return (
      <Card className="backdrop-blur">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-muted-foreground mb-8">Manage customer conversations</p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-24"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <MessageSquare className="w-12 h-12 text-primary mb-4" />
              </motion.div>
              <p className="text-muted-foreground font-medium">Loading messages...</p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur">
      <CardContent className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-muted-foreground">Connect with buyers and manage conversations</p>
        </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-primary/30 rounded-xl">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <motion.span
                className="text-3xl font-bold text-foreground"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                {messages.length}
              </motion.span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Total Conversations</h3>
            <p className="text-xs text-primary mt-1">Active chats</p>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-primary/30 rounded-xl">
                <CheckCheck className="w-5 h-5 text-primary" />
              </div>
              <motion.span
                className="text-3xl font-bold text-foreground"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                {unreadCount}
              </motion.span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Unread</h3>
            <p className="text-xs text-primary mt-1">Needs response</p>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-warning/30 rounded-xl">
                <Star className="w-5 h-5 text-warning" />
              </div>
              <motion.span
                className="text-3xl font-bold text-foreground"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
              >
                {starredCount}
              </motion.span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Starred</h3>
            <p className="text-xs text-warning mt-1">Important chats</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Conversations List */}
        <Card className="lg:col-span-1 shadow-sm overflow-hidden">
          {/* Search & Filter */}
          <CardHeader className="bg-muted p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className="flex-1"
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="flex-1"
              >
                Unread
              </Button>
              <Button
                variant={filter === 'starred' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('starred')}
                className="flex-1"
              >
                Starred
              </Button>
            </div>
          </CardHeader>

          {/* Conversations */}
          <div className="overflow-y-auto max-h-[600px]">
            <motion.div variants={container} initial="hidden" animate="show">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    variants={item}
                    onClick={() => {
                      setSelectedConversation(message);
                      markAsRead(message.id);
                    }}
                    className={`p-4 border-b border-border cursor-pointer transition-all ${
                      selectedConversation?.id === message.id
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : 'hover:bg-muted/50'
                    } ${message.unread ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {message.sender.avatar}
                        </div>
                        {message.sender.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate">{message.sender.name}</h4>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 truncate">{message.listing}</p>
                        <p className="text-sm text-foreground truncate">{message.lastMessage}</p>
                      </div>

                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        {message.unread && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(message.id);
                          }}
                          className="p-1"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              message.starred ? 'fill-warning text-warning' : 'text-muted-foreground'
                            }`}
                          />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-16 text-center">
                  <MessageSquare className="w-16 h-16 text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No conversations</h3>
                  <p className="text-muted-foreground">No messages found matching your filters</p>
                </div>
              )}
            </motion.div>
            </div>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2 shadow-sm flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 text-white rounded-full flex items-center justify-center font-bold">
                          {selectedConversation.sender.avatar}
                        </div>
                        {selectedConversation.sender.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{selectedConversation.sender.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.sender.online ? '● Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" title="Call">
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Video Call">
                        <Video className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Info">
                        <Info className="w-5 h-5" />
                      </Button>
                    </div>
                    </div>
                    </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-6 overflow-y-auto bg-muted min-h-[400px] max-h-[500px]">
                <div className="space-y-4">
                  <AnimatePresence>
                    {selectedConversation.messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            msg.sender === 'me'
                              ? 'bg-gradient-to-r from-primary to-primary/90 text-white'
                              : 'bg-background border border-border text-foreground'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <div className={`flex items-center gap-1 mt-1 text-xs ${
                            msg.sender === 'me' ? 'text-primary-foreground/80 justify-end' : 'text-muted-foreground'
                          }`}>
                            <span>{msg.time}</span>
                            {msg.sender === 'me' && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>

              {/* Message Input */}
              <CardContent className="p-4 border-t border-border bg-background">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    variant="premium"
                    size="icon"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <MessageSquare className="w-20 h-20 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
              </div>
              </CardContent>
              )}
            </Card>
          </motion.div>
        </CardContent>
      </Card>
  );
};

export default Messages;
