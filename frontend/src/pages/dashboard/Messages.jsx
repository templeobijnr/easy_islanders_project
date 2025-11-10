import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Reply, Archive, Trash2 } from 'lucide-react';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    // Mock messages data
    const mockMessages = [
      {
        id: 1,
        sender: 'John Doe',
        listing: 'iPhone 12',
        message: 'Is this still available?',
        timestamp: '2025-10-21T10:30:00',
        unread: true,
        avatar: 'JD'
      },
      {
        id: 2,
        sender: 'Jane Smith',
        listing: 'MacBook Pro',
        message: 'Can you provide more details about the specs?',
        timestamp: '2025-10-21T09:15:00',
        unread: true,
        avatar: 'JS'
      },
      {
        id: 3,
        sender: 'Mike Johnson',
        listing: 'iPhone 12',
        message: 'Thanks for the quick response!',
        timestamp: '2025-10-20T14:45:00',
        unread: false,
        avatar: 'MJ'
      }
    ];
    setMessages(mockMessages);
    setLoading(false);
  }, []);

  const filteredMessages = messages.filter(msg =>
    msg.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.listing.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = messages.filter(m => m.unread).length;

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Messages</h1>
        <p className="text-slate-600 mb-8">Manage customer conversations</p>
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Messages</h1>
        <p className="text-slate-600">Manage customer conversations</p>
      </div>

      <div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Messages</p>
            <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Unread</p>
            <p className="text-2xl font-bold text-lime-600">{unreadCount}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Conversations</p>
            <p className="text-2xl font-bold text-gray-900">{new Set(messages.map(m => m.sender)).size}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-600"
            />
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-3">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedMessage?.id === message.id
                    ? 'border-lime-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${message.unread ? 'border-l-4 border-l-brand' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-lime-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {message.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{message.sender}</h4>
                        <p className="text-sm text-gray-600">{message.listing}</p>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(message.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 truncate">{message.message}</p>
                  </div>
                  {message.unread && (
                    <div className="w-3 h-3 bg-lime-600 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Messages</h3>
              <p className="text-gray-600">No messages found matching your search</p>
            </div>
          )}
        </div>

        {/* Selected Message Detail */}
        {selectedMessage && (
          <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Message from {selectedMessage.sender}</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Reply className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Archive className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">Regarding: <strong>{selectedMessage.listing}</strong></p>
            <p className="text-gray-800 leading-relaxed">{selectedMessage.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
