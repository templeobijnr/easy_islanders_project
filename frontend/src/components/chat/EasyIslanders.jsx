// frontend/src/components/chat/EasyIslanders.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Phone,
  MapPin,
  Star,
  Car,
  Home,
  Camera,
  Utensils,
  ShoppingBag,
  Heart,
  ExternalLink,
  User,
  LogIn,
  LogOut,
} from 'lucide-react';
import axios from 'axios';
import config from '../../config';
import ImageGallery from '../common/ImageGallery';
import ChatImageBubble from './ChatImageBubble';

const EasyIslanders = () => {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content:
        'Welcome to Easy Islanders! I am your personal assistant for anything you need in North Cyprus. Before we start, May I ask what language you speak?',
      language: 'en',
      recommendations: [],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(config.getLanguage());
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Gallery modal (global) state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryListingId, setGalleryListingId] = useState(null);
  const [galleryVerified, setGalleryVerified] = useState(false);

  // ✅ Single source of truth for conversationId
  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem('conversationId') || null;
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('conversationId', conversationId);
    }
  }, [conversationId]);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Update language when selectedLanguage changes
  useEffect(() => {
    config.setLanguage(selectedLanguage);
  }, [selectedLanguage]);

  // Poll for notifications when conversation is active
  useEffect(() => {
    let pollingInterval = null;
    
    if (conversationId && isAuthenticated) {
      // Start polling for notifications every 5 seconds
      pollingInterval = setInterval(async () => {
        try {
          const response = await axios.get(
            `${config.getApiUrl()}/api/notifications/?conversation_id=${conversationId}`,
            { timeout: 10000 }
          );
          
          const notifications = response.data.notifications || [];
          
          if (notifications.length > 0) {
            console.log('Received notifications:', notifications);
            
            // Process each notification
            notifications.forEach(notification => {
              if (notification.type === 'new_images' || notification.type === 'card_update') {
                const data = notification.data || {};
                const galleryMsg = {
                  type: 'image_gallery',
                  listing_id: data.listing_id,
                  image_urls: data.image_urls || [],
                  verified_with_photos: !!data.verified_with_photos,
                  message: data.message || `New images received! ${data.image_count || 0} image(s) added to the listing.`,
                  timestamp: notification.timestamp
                };
                setMessages(prev => {
                  const exists = prev.some(m => m.type === 'image_gallery' && m.listing_id === galleryMsg.listing_id && m.timestamp === galleryMsg.timestamp);
                  if (!exists) return [...prev, galleryMsg];
                   return prev;
                });
              }
              if (notification.type === 'availability_update') {
                const data = notification.data || notification; // support both shapes
                const text = data.message || `Agent confirmed listing ${data.listing_id} is ${data.availability}.`;
                const msg = {
                  type: 'assistant',
                  content: text,
                  language: selectedLanguage,
                  recommendations: [],
                  timestamp: notification.timestamp
                };
                setMessages(prev => [...prev, msg]);
              }
            });
            
            // Clear notifications after processing
            try {
              await axios.post(`${config.getApiUrl()}/api/notifications/clear/`, {
                conversation_id: conversationId
              });
            } catch (clearError) {
              console.warn('Failed to clear notifications:', clearError);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
          // Don't show error to user, just log it
        }
      }, 5000); // Poll every 5 seconds
    }
    
    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [conversationId, isAuthenticated, selectedLanguage]);

  // --- Live API Call ---
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      language: selectedLanguage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(config.getApiUrl(config.ENDPOINTS.CHAT), {
        message: inputMessage,
        language: selectedLanguage,
        conversation_id: conversationId,
      });

      const apiData = response.data;
      setConversationId(apiData.conversation_id);

      const assistantMessage = {
        type: 'assistant',
        content: apiData.response,
        language: apiData.language,
        recommendations: apiData.recommendations || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (apiData.requires_phone) {
        setShowPhoneInput(true);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = {
        type: 'assistant',
        content:
          'Sorry, I am having trouble connecting to my services right now. Please try again in a moment.',
        language: selectedLanguage,
        recommendations: [],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  // --- End of Live API Call ---

  const languages = {
    en: 'English',
    ru: 'Русский',
    pl: 'Polski',
    de: 'Deutsch',
    tr: 'Türkçe',
  };

  // Authentication functions
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(config.getApiUrl(config.ENDPOINTS.AUTH.STATUS));
      setIsAuthenticated(response.data.authenticated);
      if (response.data.authenticated) {
        setUser({
          id: response.data.user_id,
          username: response.data.username
        });
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post(config.getApiUrl(config.ENDPOINTS.AUTH.LOGIN), credentials);
      setIsAuthenticated(true);
      setUser({
        id: response.data.user_id,
        username: response.data.username
      });
      setShowAuthModal(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const handleRegister = async (userData) => {
    try {
      const response = await axios.post(config.getApiUrl(config.ENDPOINTS.AUTH.REGISTER), userData);
      setIsAuthenticated(true);
      setUser({
        id: response.data.user_id,
        username: response.data.username
      });
      setShowAuthModal(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(config.getApiUrl(config.ENDPOINTS.AUTH.LOGOUT));
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const translations = {
    en: {
      placeholder: 'Ask me anything about North Cyprus...',
      phonePrompt: 'Phone number for assistance',
      namePrompt: 'Your name (optional)',
      send: 'Send',
      book: 'View Details',
      recommendations: "Here's what I found for you:",
      rating: 'Rating',
      features: 'Features',
      priceFrom: 'From',
    },
  };

  const t = translations[selectedLanguage] || translations.en;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const RecommendationCard = ({ item }) => {
    const [currentImage, setCurrentImage] = useState(
      (item.images && item.images.length > 0) ? item.images[0] : ''
    );
    const [verified, setVerified] = useState(false);
    const [isPolling, setIsPolling] = useState(false);

    const resolvedImageUrl = currentImage
      ? (currentImage.startsWith('http') ? currentImage : `${config.API_BASE_URL}${currentImage}`)
      : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop';

    const startPhotoPolling = async (listingId) => {
      if (!config.POLLING.ENABLED) return;
      
      let attempts = 0;
      const maxAttempts = 24; // ~2 minutes at 5s interval
      
      // Get initial image count before polling
      let initialResponse;
      try {
        initialResponse = await axios.get(config.getApiUrl(`${config.ENDPOINTS.LISTINGS.DETAILS}${listingId}/`));
        const initialImages = initialResponse.data?.images || [];
        const initialCount = initialImages.length;
        const initialVerified = !!initialResponse.data?.verified_with_photos;
        
        if (initialVerified && initialCount > 0) {
          // Already has verified photos, no need to poll
          setCurrentImage(initialImages[0]);
          setVerified(true);
          return;
        }
        
        setIsPolling(true);
        
        const intervalId = setInterval(async () => {
          attempts += 1;
          try {
            const res = await axios.get(config.getApiUrl(`${config.ENDPOINTS.LISTINGS.DETAILS}${listingId}/`));
            const images = res.data?.images || [];
            const currentCount = images.length;
            const verified = !!res.data?.verified_with_photos;
            
            if (verified && currentCount > initialCount) {
              setCurrentImage(images[0]);
              setVerified(true);
              clearInterval(intervalId);
              setIsPolling(false);
            } else if (attempts >= maxAttempts) {
              clearInterval(intervalId);
              setIsPolling(false);
            }
          } catch (e) {
            if (attempts >= maxAttempts) {
              clearInterval(intervalId);
              setIsPolling(false);
            }
          }
        }, config.POLLING.INTERVAL);
      } catch (e) {
        console.error('Failed to get initial listing state for polling:', e);
        setIsPolling(false);
      }
    };

    const openGallery = async (listingId) => {
      try {
        const res = await axios.get(config.getApiUrl(`${config.ENDPOINTS.LISTINGS.IMAGES}${listingId}/images/`));
        const imgs = (res.data?.image_urls || []).map(u => u?.startsWith('http') ? u : `${config.API_BASE_URL}${u.startsWith('/') ? u : '/' + u}`);
        setGalleryImages(imgs);
        setGalleryListingId(listingId);
        setGalleryVerified(!!res.data?.verified_with_photos);
        setGalleryOpen(true);
      } catch (e) {
        console.error('Failed to open gallery', e);
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 w-80 flex-shrink-0">
        <div className="relative">
          <img
            src={resolvedImageUrl}
            alt={item.title || item.name}
            className="w-full h-48 object-cover"
          />
          {isPolling && (
            <div className="absolute bottom-2 left-2 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded">
              Waiting for photos…
            </div>
          )}
          {verified && !isPolling && (
            <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
              Photos received
            </div>
          )}
          {item.rating && (
            <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{item.rating}</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {item.title || item.name}
              </h3>
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {item.location || 'North Cyprus'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-blue-600 font-bold text-lg">
                {item.price || item.price_range}
              </div>
              <div className="text-gray-500 text-xs">
                {item.source || t.priceFrom}
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-3">{item.description}</p>

          {item.features && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-700 mb-2">
                {t.features}:
              </div>
              <div className="flex flex-wrap gap-1">
                {item.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                  >
                    {typeof feature === 'object' ? feature.name : feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {/* View Photos (if any) */}
            {(item.images && item.images.length > 0) && (
              <button
                onClick={() => openGallery(item.id)}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                View Photos
              </button>
            )}
            <button
              onClick={() =>
                window.open(
                  item.details_url || item.bookingLink || item.url,
                  '_blank'
                )
              }
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {t.book}
            </button>
            <button
            onClick={async () => {
              try {
                await axios.post(config.getApiUrl(config.ENDPOINTS.LISTINGS.OUTREACH), {
                  listing_id: item.id,
                  channel: "whatsapp"
                });
                // Begin polling for photos and update the card when available
                startPhotoPolling(item.id);
                alert("We’ve contacted the agent. I’ll update the photos here as soon as they arrive.");
              } catch (error) {
                console.error("Error contacting agent:", error);
                alert("Sorry, we couldn’t reach the agent right now.");
              }
            }}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Contact Agent
            </button>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <Heart className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Easy Islanders
                </h1>
                <p className="text-sm text-gray-600">
                  Your North Cyprus Action Agent
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              
              {/* Authentication Section */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-[32rem] overflow-y-auto p-6 bg-gray-50">
            {messages.map((message, index) => (
              <div key={index} className="mb-6">
                <div
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'image_gallery' ? (
                    <ChatImageBubble message={message} />
                  ) : (
                    <div
                      className={`max-w-2xl ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl'
                          : 'bg-white border rounded-r-xl rounded-tl-xl shadow-sm'
                      } px-4 py-3`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  )}
                </div>

                {message.recommendations &&
                  message.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        {t.recommendations}
                      </h3>
                      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
                        {message.recommendations.map((item, idx) => (
                          <RecommendationCard key={item.id || idx} item={item} />
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-r-xl rounded-tl-xl shadow-sm px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ✅ Phone & name capture when AI requests it */}
          {showPhoneInput && (
            <div className="border-t p-4 bg-gray-50">
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder={t.phonePrompt}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t.namePrompt}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="border-t p-4 bg-white">
            <div className="flex gap-3">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.placeholder}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                {t.send}
              </button>
            </div>
          </div>
        </div>

        {galleryOpen && (
          <ImageGallery
            images={galleryImages}
            listingId={galleryListingId}
            verified={galleryVerified}
            onClose={() => setGalleryOpen(false)}
          />
        )}

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              key: 'car_rental',
              icon: Car,
              label: { en: 'Rent a Car', ru: 'Арендовать машину' },
            },
            {
              key: 'accommodation',
              icon: Home,
              label: { en: 'Find Rentals', ru: 'Найти жилье' },
            },
            {
              key: 'activities',
              icon: Camera,
              label: { en: 'Things to Do', ru: 'Развлечения' },
            },
            {
              key: 'dining',
              icon: Utensils,
              label: { en: 'Restaurants', ru: 'Рестораны' },
            },
          ].map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.key}
                onClick={() =>
                  setInputMessage(
                    action.label[selectedLanguage] || action.label.en
                  )
                }
                className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center gap-3"
              >
                <IconComponent className="w-8 h-8 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">
                  {action.label[selectedLanguage] || action.label.en}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {authMode === 'login' ? 'Login' : 'Register'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData);
                
                let result;
                if (authMode === 'login') {
                  result = await handleLogin(data);
                } else {
                  result = await handleRegister(data);
                }
                
                if (!result.success) {
                  alert(result.error);
                }
              }}
              className="space-y-4"
            >
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {authMode === 'login' ? 'Login' : 'Register'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Register" 
                  : "Already have an account? Login"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EasyIslanders;
