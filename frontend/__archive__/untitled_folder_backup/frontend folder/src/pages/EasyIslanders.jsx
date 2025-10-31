// frontend/src/pages/EasyIslanders.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Car, Home, Camera, Utensils, Compass, Menu, Waves, MapPin
} from 'lucide-react';
import api from '../api';
import config from '../config';

const RecommendationCard = ({ item }) => (
  <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
    <img
      src={item.image_urls?.[0] ? (item.image_urls[0].startsWith('http') ? item.image_urls[0] : `${config.API_BASE_URL}${item.image_urls[0]}`) : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop'}
      alt={item.title}
      className="w-full h-40 object-cover"
    />
    <div className="p-4">
      <h3 className="font-bold text-gray-800 text-base truncate">{item.title}</h3>
      <div className="flex items-center text-gray-500 text-sm mt-1">
        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
        <span className="truncate">{item.location}</span>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="font-bold text-gray-800 text-sm">{item.price ? `${item.price} ${item.currency}` : 'Price not listed'}</div>
        {/* The Listing model does not have a rating field, so we will hide this for now */}
        {/* {item.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-semibold">{item.rating}</span>
          </div>
        )} */}
      </div>
    </div>
  </div>
);

const FEATURED_CATEGORIES = {
  accommodation: 'Hotels',
  car_rental: 'Car Rentals',
  dining: 'Restaurants',
  beaches: 'Beaches',
};

const EasyIslanders = () => {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: 'Welcome to Easy Islanders! I am your personal assistant for anything you need in North Cyprus. Before we start, may I ask what language you speak?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(config.getLanguage());
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => localStorage.getItem('conversationId') || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // State for Featured Section
  const [featured, setFeatured] = useState({ accommodation: [], car_rental: [], dining: [], beaches: [] });
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredTab, setFeaturedTab] = useState('accommodation');

  // State for dynamic layout
  const [isScrolledPastChat, setIsScrolledPastChat] = useState(false);
  const [chatHeight, setChatHeight] = useState('h-3/4');
  const [featuredHeight, setFeaturedHeight] = useState('h-1/4');
  const mainContentRef = useRef(null);
  const chatSectionRef = useRef(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setFeaturedLoading(true);
      try {
        const categoriesToFetch = Object.keys(FEATURED_CATEGORIES);
        const requests = categoriesToFetch.map(cat => api.getRecommendations(cat, selectedLanguage));
        const responses = await Promise.all(requests);
        const newFeatured = {};
        categoriesToFetch.forEach((cat, i) => {
          newFeatured[cat] = responses[i].slice(0, 4).map(item => ({...item, id: item.id || item.pk || Math.random() }));
        });
        setFeatured(newFeatured);
      } catch (error) {
        console.error("Failed to load featured content", error);
      } finally {
        setFeaturedLoading(false);
      }
    };
    fetchFeatured();
  }, [selectedLanguage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('conversationId', conversationId);
    }
  }, [conversationId]);

  // Dynamic layout based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Use window.scrollY to detect scroll position of the entire page
      const scrollTop = window.scrollY;

      // Set a fixed threshold (e.g., 100px) to trigger the layout change
      const threshold = 100;
      const scrolledPast = scrollTop > threshold;

      if (scrolledPast !== isScrolledPastChat) {
        setIsScrolledPastChat(scrolledPast);

        if (scrolledPast) {
          // User scrolled down - expand featured section
          setChatHeight('h-1/2');
          setFeaturedHeight('h-1/2');
        } else {
          // User is at the top - restore original ratio
          setChatHeight('h-3/4');
          setFeaturedHeight('h-1/4');
        }
      }
    };

    // Attach listener to the window
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup listener on component unmount
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolledPastChat]);

  const handleSendMessage = async (messageContent) => {
    const currentInput = messageContent || inputMessage;
    if (!currentInput.trim() || isLoading) return;

    const userMessage = { type: 'user', content: currentInput };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage(currentInput, selectedLanguage, conversationId);
      setConversationId(response.conversation_id);
      const assistantMessage = {
        type: 'assistant',
        content: response.response,
        recommendations: response.recommendations || [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = {
        type: 'assistant',
        content: 'Sorry, I am having trouble connecting. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'chat', icon: Compass, label: 'Chat Assistant' },
    { id: 'accommodation', icon: Home, label: 'Hotels' },
    { id: 'car_rental', icon: Car, label: 'Car Rentals' },
    { id: 'activities', icon: Camera, label: 'Activities' },
    { id: 'dining', icon: Utensils, label: 'Restaurants' },
    { id: 'beaches', icon: Waves, label: 'Beaches' }
  ];

  console.log('API Object:', api); // Debug: Log the api object to check available methods

  return (
    <div className="flex bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-white shadow-lg transform transition-transform duration-300 border-r border-gray-100 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex-shrink-0 flex flex-col`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Easy Islander</h1>
          <p className="text-sm text-gray-500">Travel Assistant</p>
            </div>
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-auto mx-6 bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 cursor-pointer"
        >
          <option value="en">English</option>
          <option value="tr">Türkçe</option>
          <option value="ru">Русский</option>
            </select>
        <nav className="flex-1 p-4 mt-4 space-y-2">
          {sidebarItems.map((item) => (
                <button
                  key={item.id}
              onClick={() => {
                if(item.id !== 'chat') handleSendMessage(`Find ${item.label.toLowerCase()}`);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-semibold ${
                item.id === 'chat'
                  ? 'bg-brand text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
                </button>
          ))}
          </nav>
        <div className="p-6 mt-auto border-t border-gray-100">
          <p className="text-xs text-center text-gray-400">Powered by <span className="font-semibold text-brand">Easy Islander AI</span></p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content - now a simple flex container */}
      <main ref={mainContentRef} className="flex-1 flex flex-col">
        {/* Chat section (wrapper for messages and input) */}
        <div ref={chatSectionRef} className={`${chatHeight} flex flex-col w-full max-w-7xl mx-auto px-4 pt-8 transition-all duration-500 ease-in-out`}>
          {/* Messages (scrollable only here) */}
          <div className="flex-1 overflow-y-auto space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}>
                <div className={`max-w-xl px-5 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-brand text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                          </div>
            ))}
              {isLoading && (
              <div className="flex items-start gap-3">
                <div className="bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-brand rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-brand rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-brand rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input (pinned at bottom of chat section) */}
          <div className="bg-gray-50/80 backdrop-blur-md border-t border-gray-100">
            <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto">
              <div className="relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder="Ask me anything..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-brand"
                rows="1"
                />
                <button
                onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand text-white p-2 rounded-lg hover:bg-brand-dark disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured (now scrollable in its own container) */}
        <div className={`${featuredHeight} w-full max-w-7xl mx-auto p-4 lg:p-8 space-y-6 border-t border-gray-200 bg-white transition-all duration-500 ease-in-out`}>
          <h2 className="text-3xl font-bold text-gray-800">Featured For You</h2>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {[
              { key: 'accommodation', label: 'Hotels', icon: Home },
              { key: 'car_rental', label: 'Car Rentals', icon: Car },
              { key: 'dining', label: 'Restaurants', icon: Utensils },
              { key: 'beaches', label: 'Beaches', icon: Waves },
            ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFeaturedTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors text-sm font-semibold ${
                    featuredTab === key
                    ? 'bg-brand text-white border-transparent'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                {label}
                </button>
              ))}
            </div>
          {featuredLoading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-gray-500">Loading featured content...</p>
            </div>
          ) : (featured[featuredTab] || []).length === 0 ? (
            <p className="text-gray-500 text-center py-12">No featured content available yet. Start chatting to discover more!</p>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-2 -mr-4 pr-2">
              {(featured[featuredTab] || []).slice(0, 4).map(item => (
                <RecommendationCard key={item.id} item={item} />
              ))}
              <div className="w-4 flex-shrink-0"></div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Menu Button */}
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed top-5 left-5 z-50 bg-white p-3 rounded-full shadow-lg border border-gray-100">
        <Menu className="w-5 h-5 text-gray-800" />
              </button>
    </div>
  );
};

export default EasyIslanders;