// frontend/src/components/chat/EasyIslanders.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Compass,
  Menu,
  X,
  TrendingUp,
  Sparkles,
  Waves,
  Mountain,
  TreePine,
  Building2,
  Plane,
  Sun,
  Moon,
} from 'lucide-react';
import config from '../../config';
import ImageGallery from '../common/ImageGallery';
import ChatImageBubble from './ChatImageBubble';
import api, { http } from '../../api'; // Centralized API client
import ListingCard from './ListingCard'; // The new UI component

const EasyIslanders = () => {
  // ✅ PRESERVE ALL EXISTING STATE MANAGEMENT
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

  // ✅ PRESERVE GALLERY MODAL STATE
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryListingId, setGalleryListingId] = useState(null);
  const [galleryVerified, setGalleryVerified] = useState(false);

  // ✅ PRESERVE CONVERSATION MANAGEMENT
  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem('conversationId') || null;
  });

  // ✅ PRESERVE LISTINGS STATE AND POLLING
  const [listingsState, setListingsState] = useState({}); // State for all listings data
  const [pollingIntervals, setPollingIntervals] = useState({});

  // ✅ PRESERVE SIDEBAR STATE
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('chat');

  // Featured datasets
  const [featured, setFeatured] = useState({
    car_rental: [],
    accommodation: [],
    activities: [],
    dining: [],
  });
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredError, setFeaturedError] = useState(null);
  const [featuredTab, setFeaturedTab] = useState('car_rental');

  // Theme (light/dark) with persistence
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ei_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });
  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('ei_theme', theme);
    // Optional: set root class for global dark styles if needed elsewhere
    const root = document.documentElement;
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme, isDark]);

  // ✅ PRESERVE ALL EXISTING FUNCTIONS
  const updateListingState = (listingId, data) => {
    setListingsState(prevState => ({ ...prevState, [listingId]: data }));
  };

  const handleRequestPhotos = async (listingId) => {
    try {
      // Immediately update UI to "Waiting..."
      const updatedListing = await api.requestPhotos(listingId);
      updateListingState(listingId, updatedListing);

      // Start polling for this listing
      const intervalId = setInterval(async () => {
        const freshListingData = await api.getListing(listingId);
        if (freshListingData.image_urls && freshListingData.image_urls.length > 0) {
          // Photos have arrived! Update the state and stop polling.
          updateListingState(listingId, freshListingData);
          clearInterval(pollingIntervals[listingId]);
        }
      }, config.POLLING.INTERVAL || 5000);

      setPollingIntervals(prev => ({ ...prev, [listingId]: intervalId }));

    } catch (error) {
      console.error("Error requesting photos:", error);
      // Optionally revert the UI state on error
    }
  };
  
  const handleViewPhotos = async (listingId) => {
    try {
      const res = await http.get(`${config.ENDPOINTS.LISTINGS.IMAGES}${listingId}/images/`);
      const imgs = (res.data?.image_urls || []).map(u => u?.startsWith('http') ? u : `${config.API_BASE_URL}${u.startsWith('/') ? u : '/' + u}`);
      setGalleryImages(imgs);
      setGalleryListingId(listingId);
      setGalleryVerified(!!res.data?.verified_with_photos);
      setGalleryOpen(true);
    } catch (e) {
      console.error('Failed to open gallery', e);
    }
  };

  // ✅ PRESERVE ALL EXISTING USEEFFECTS
  // Fetch initial listing data when a card appears
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.type === 'listing_card' && !listingsState[msg.listing_id]) {
        api.getListing(msg.listing_id).then(data => updateListingState(msg.listing_id, data));
      }
    });
  }, [messages, listingsState]);

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

  // Fetch featured data (cars, hotels, activities, dining)
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setFeaturedLoading(true);
        setFeaturedError(null);
        const categories = ['car_rental', 'accommodation', 'activities', 'dining'];
        const requests = categories.map(cat =>
          http.get(`${config.ENDPOINTS.RECOMMENDATIONS}?category=${cat}&language=${selectedLanguage}`)
        );
        const results = await Promise.allSettled(requests);
        const next = { car_rental: [], accommodation: [], activities: [], dining: [] };
        categories.forEach((cat, idx) => {
          const res = results[idx];
          if (res.status === 'fulfilled') {
            // Normalize items to RecommendationCard shape
            const items = Array.isArray(res.value.data) ? res.value.data : [];
            next[cat] = items.map(x => ({
              id: x.id || x.pk || x.slug || Math.random().toString(36).slice(2),
              title: x.title || x.name || 'Featured',
              description: x.description || '',
              location: x.location || x.city || 'North Cyprus',
              price: x.price || x.price_range || x.cost || '',
              images: x.images || (x.image ? [x.image] : []),
              features: x.features || [],
              verified_with_photos: !!x.verified_with_photos,
              details_url: x.details_url || x.url || null,
              rating: x.rating || null,
            }));
          }
        });
        setFeatured(next);
      } catch (e) {
        setFeaturedError('Failed to load featured content');
      } finally {
        setFeaturedLoading(false);
      }
    };
    fetchFeatured();
  }, [selectedLanguage]);

  // Update language when selectedLanguage changes
  useEffect(() => {
    config.setLanguage(selectedLanguage);
  }, [selectedLanguage]);

  // ✅ PRESERVE POLLING SYSTEM
  useEffect(() => {
    let pollingInterval = null;
    
    console.log(`[POLLING SETUP] conversationId: ${conversationId}, isAuthenticated: ${isAuthenticated}`);
    console.log(`[POLLING SETUP] Component mounted/updated - this should appear in console`);
    
    if (conversationId && isAuthenticated) {
      console.log(`[POLLING SETUP] Starting polling for conversation: ${conversationId}`);
      // Start polling for notifications every 5 seconds
      pollingInterval = setInterval(async () => {
        try {
          console.log(`[POLLING] Checking notifications for conversation: ${conversationId}`);
          const response = await http.get('/api/notifications/', {
            params: { conversation_id: conversationId },
            timeout: 10000,
          });
          
          console.log(`[POLLING] API Response:`, response.data);
          const notifications = response.data.notifications || [];
          
          if (notifications.length > 0) {
            console.log(`[POLLING] Received ${notifications.length} notifications:`, notifications);
            
            setMessages(prevMessages => {
              let messagesChanged = false;
              const updatedMessages = [...prevMessages]; // Create a mutable copy

              notifications.forEach(notification => {
                if (notification.type === 'new_images') {
                  const data = notification.data || {};
                  const listingId = data.listing_id;
                  
                  // Find and update the recommendation in the existing messages
                  for (let i = 0; i < updatedMessages.length; i++) {
                    const msg = updatedMessages[i];
                    if (msg.recommendations && msg.recommendations.length > 0) {
                      const recIndex = msg.recommendations.findIndex(rec => String(rec.id) === String(listingId));
                      if (recIndex !== -1) {
                        // Update the specific recommendation with new image data
                        msg.recommendations[recIndex].images = data.image_urls || [];
                        msg.recommendations[recIndex].verified_with_photos = !!data.verified_with_photos;
                        messagesChanged = true;
                        console.log(`Updated recommendation card for listing ${listingId} with ${data.image_urls?.length || 0} images`);
                        break; // Stop searching once updated
                      }
                    }
                  }
                  
                  // ALSO update listingsState for ListingCard components
                  setListingsState(prev => ({
                    ...prev,
                    [listingId]: {
                      ...prev[listingId],
                      image_urls: data.image_urls || [],
                      verified_with_photos: !!data.verified_with_photos
                    }
                  }));
                  console.log(`Updated listingsState for listing ${listingId} with ${data.image_urls?.length || 0} images`);
                } else if (notification.type === 'availability_update') {
                  const data = notification.data || notification;
                  const text = data.message || `Agent confirmed listing ${data.listing_id} is ${data.availability}.`;
                  updatedMessages.push({
                    type: 'assistant',
                    content: text,
                    language: selectedLanguage,
                    recommendations: [],
                    timestamp: notification.timestamp
                  });
                  messagesChanged = true;
                } else if (notification.type === 'proactive_update') {
                  // Handle proactive agent updates (automatic notifications)
                  const data = notification.data || {};
                  const message = data.message || 'I have an update for you!';
                  const recommendations = data.recommendations || [];
                  
                  console.log('[POLLING] Received proactive_update notification:', { 
                    type: notification.type,
                    message, 
                    recommendationsCount: recommendations.length,
                    fullData: data,
                    fullNotification: notification
                  });
                  
                  updatedMessages.push({
                    type: 'assistant',
                    content: message,
                    language: 'en',
                    recommendations: recommendations,
                    proactive: true,
                    timestamp: new Date().toISOString()
                  });
                  messagesChanged = true;
                  
                  // Auto-scroll to show the new message
                  console.log('[POLLING] Adding proactive message to chat:', {
                    message,
                    recommendationsCount: recommendations.length,
                    proactive: true
                  });
                  setTimeout(() => {
                    scrollToBottom();
                  }, 100);
                }
              });

              return messagesChanged ? updatedMessages : prevMessages;
            });
            
            // Clear notifications after processing
            try {
              await http.post('/api/notifications/clear/', {
                conversation_id: conversationId,
              });
            } catch (clearError) {
              console.warn('Failed to clear notifications:', clearError);
            }
          }
        } catch (error) {
          console.error('[POLLING] Error polling for notifications:', error);
          console.error('[POLLING] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            conversationId
          });
          // Don't show error to user, just log it
        }
      }, 5000); // Poll every 5 seconds
      
      console.log(`[POLLING SETUP] Polling interval created for conversation: ${conversationId}`);
    } else {
      console.log(`[POLLING SETUP] Not starting polling - conversationId: ${conversationId}, isAuthenticated: ${isAuthenticated}`);
    }
    
    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (pollingInterval) {
        console.log(`[POLLING CLEANUP] Clearing polling interval for conversation: ${conversationId}`);
        clearInterval(pollingInterval);
      }
    };
  }, [conversationId, isAuthenticated, selectedLanguage]);

  // ✅ PRESERVE API CALL FUNCTIONALITY
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // ✅ SIMPLIFIED AUTHENTICATION CHECK
    // Rely *only* on the presence of the token in localStorage.
    // This avoids race conditions with React state updates.
    const token = localStorage.getItem('token');
    if (!token) {
      // User not authenticated - show login modal instead
      setShowAuthModal(true);
      setAuthMode('login');
      setAuthError('Please log in to send messages');
      return;
    }

    const userMessage = {
      type: 'user',
      content: inputMessage,
      language: selectedLanguage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const apiData = await api.sendChatMessage(
        inputMessage,
        selectedLanguage,
        conversationId
      );
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

      // NEW: On notif, re-fetch listings
      if (apiData.notifications && apiData.notifications.length > 0) {
        apiData.notifications.forEach(notif => {
          if (notif.type === 'new_images') {
            const listingId = notif.data.listing_id;
            // ✅ Now uses global interceptor - automatically adds JWT
            api.getListing(listingId).then(data => {
              setListingsState(prev => ({ ...prev, [listingId]: data }));
              setMessages(prev => [...prev, { type: 'assistant', content: 'Photos received!', recommendations: [data] }]);
            });
          }
        });
        // ✅ Now uses global interceptor - automatically adds JWT
        http.post('/api/chat/clear-notifications/', { conversation_id: conversationId });
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

  // ✅ PRESERVE AUTHENTICATION FUNCTIONS
  const checkAuthStatus = async () => {
    try {
      // ✅ Now uses global interceptor - automatically adds JWT
      const response = await http.get(config.ENDPOINTS.AUTH.STATUS);
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
      // ✅ Now uses global interceptor - automatically adds JWT
      const response = await http.post(config.ENDPOINTS.AUTH.LOGIN, credentials);
      const accessToken = response.data.token || response.data.access;
      const refreshToken = response.data.refresh;
      if (accessToken) {
        localStorage.setItem('token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refresh', refreshToken);
      }
      setIsAuthenticated(true);
      setUser({
        id: response.data.user?.id,
        username: response.data.user?.username,
      });
      setShowAuthModal(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const handleRegister = async (userData) => {
    try {
      // ✅ Now uses global interceptor - automatically adds JWT
      const response = await http.post(config.ENDPOINTS.AUTH.REGISTER, userData);
      const accessToken = response.data.token || response.data.access;
      const refreshToken = response.data.refresh;
      if (accessToken) {
        localStorage.setItem('token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refresh', refreshToken);
      }
      setIsAuthenticated(true);
      setUser({
        id: response.data.user?.id,
        username: response.data.user?.username,
      });
      setShowAuthModal(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const handleLogout = async () => {
    try {
      await http.post(config.ENDPOINTS.AUTH.LOGOUT);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // ✅ PRESERVE LANGUAGES AND TRANSLATIONS
  const languages = {
    en: 'English',
    ru: 'Русский',
    pl: 'Polski',
    de: 'Deutsch',
    tr: 'Türkçe',
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
      welcomeTitle: 'Discover North Cyprus',
      welcomeSubtitle: 'Your personalized travel assistant',
    },
  };

  const t = translations[selectedLanguage] || translations.en;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ✅ PRESERVE SIDEBAR ITEMS
  const sidebarItems = [
    { 
      id: 'chat', 
      icon: MapPin, 
      label: { en: 'Chat Assistant', ru: 'Чат-ассистент', tr: 'Sohbet Asistanı' },
      gradient: 'from-cyan-500 to-blue-600'
    },
    { 
      id: 'accommodation', 
      icon: Home, 
      label: { en: 'Hotels', ru: 'Отели', tr: 'Oteller' },
      gradient: 'from-violet-500 to-purple-600'
    },
    { 
      id: 'car_rental', 
      icon: Car, 
      label: { en: 'Car Rentals', ru: 'Аренда авто', tr: 'Araç Kiralama' },
      gradient: 'from-orange-500 to-pink-600'
    },
    { 
      id: 'activities', 
      icon: Camera, 
      label: { en: 'Activities', ru: 'Развлечения', tr: 'Aktiviteler' },
      gradient: 'from-emerald-500 to-teal-600'
    },
    { 
      id: 'dining', 
      icon: Utensils, 
      label: { en: 'Restaurants', ru: 'Рестораны', tr: 'Restoranlar' },
      gradient: 'from-red-500 to-rose-600'
    },
    { 
      id: 'beaches', 
      icon: Waves, 
      label: { en: 'Beaches', ru: 'Пляжи', tr: 'Plajlar' },
      gradient: 'from-sky-500 to-cyan-600'
    }
  ];

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    setSidebarOpen(false);
    
    if (categoryId === 'chat') return;
    
    const categoryLabels = {
      accommodation: 'Find hotels',
      car_rental: 'Rent a car',
      activities: 'Show activities',
      dining: 'Find restaurants',
      beaches: 'Show beaches'
    };
    
    const message = categoryLabels[categoryId] || `Show ${categoryId}`;
    setInputMessage(message);
    setTimeout(() => handleSendMessage(), 100);
  };

  // ✅ PRESERVE RECOMMENDATION CARD COMPONENT
  const RecommendationCard = ({ item }) => {
    const [currentImage, setCurrentImage] = useState(
      (item.images && item.images.length > 0) ? item.images[0] : ''
    );
    const [verified, setVerified] = useState(!!item.verified_with_photos);
    const [imageCount, setImageCount] = useState(item.images?.length || 0);
    const [isPolling, setIsPolling] = useState(false);

    // Update local state when item prop changes (reactive to new images)
    useEffect(() => {
      console.log(`RecommendationCard for listing ${item.id}:`, {
        hasImages: !!(item.images && item.images.length > 0),
        imageCount: item.images?.length || 0,
        verified: !!item.verified_with_photos,
        currentImage: currentImage,
        verifiedState: verified
      });
      
      if (item.images && item.images.length > 0) {
        setCurrentImage(item.images[0]);
        setVerified(!!item.verified_with_photos);
        setImageCount(item.images.length);
        setIsPolling(false); // Stop polling if images arrived
        console.log(`Updated RecommendationCard for listing ${item.id} with ${item.images.length} images`);
      }
    }, [item.images, item.verified_with_photos, item.id]);

    const resolvedImageUrl = currentImage
      ? (currentImage.startsWith('http') ? currentImage : `${config.API_BASE_URL}${currentImage}`)
      : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop';

    const startPhotoPolling = async (listingId) => {
      if (!config.POLLING.ENABLED) return;
      
      let attempts = 0;
      const maxAttempts = 24; // ~2 minutes at 5s interval
      
      // Get initial image count before polling
      let initialData;
      try {
        initialData = await api.getListing(listingId);
        const initialImages = initialData?.images || [];
        const initialCount = initialImages.length;
        const initialVerified = !!initialData?.verified_with_photos;
        
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
            const res = await api.getListing(listingId);
            const images = res?.images || [];
            const currentCount = images.length;
            const verified = !!res?.verified_with_photos;
            
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
        const res = await http.get(`${config.ENDPOINTS.LISTINGS.IMAGES}${listingId}/images/`);
        const raw = Array.isArray(res.data?.image_urls)
          ? res.data.image_urls
          : (res.data?.images || []);
        const imgs = raw.map(u => u?.startsWith('http') ? u : `${config.API_BASE_URL}${u.startsWith('/') ? u : '/' + u}`);
        setGalleryImages(imgs);
        setGalleryListingId(listingId);
        setGalleryVerified(!!res.data?.verified_with_photos);
        setGalleryOpen(true);
      } catch (e) {
        console.error('Failed to open gallery', e);
      }
    };

    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden hover:shadow-cyan-500/20 hover:scale-105 transition-all duration-300 w-80 flex-shrink-0 border border-gray-700/50">
        <div className="relative">
          <img
            src={resolvedImageUrl}
            alt={item.title || item.name}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
          
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
            <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-lg border border-gray-700/50">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-white">{item.rating}</span>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg mb-1">
                {item.title || item.name}
              </h3>
              <div className="flex items-center text-gray-400 text-sm">
                <MapPin className="w-4 h-4 mr-1 text-cyan-400" />
                {item.location || 'North Cyprus'}
              </div>
            </div>
            <div className="text-right ml-3">
              <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-bold text-xl">
                {item.price || item.price_range}
              </div>
              <div className="text-gray-500 text-xs">{t.priceFrom}</div>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-4 leading-relaxed">{item.description}</p>

          {item.features && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">{t.features}:</div>
              <div className="flex flex-wrap gap-2">
                {item.features.map((feature, idx) => (
                  <span key={idx} className="bg-gradient-to-r from-gray-800 to-gray-700 text-cyan-400 px-3 py-1 rounded-full text-xs font-medium border border-gray-600/50">
                    {typeof feature === 'object' ? feature.name : feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {/* Dynamic Photo Button - show View Photos if any images exist */}
            {imageCount > 0 ? (
              <button
                onClick={() => openGallery(item.id)}
                className="flex-1 bg-indigo-600 text-white py-2.5 px-2 rounded-xl hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              >
                <Camera className="w-4 h-4" />
                View Photos ({imageCount})
              </button>
            ) : (
              <button
                onClick={async () => {
                  try {
                    const result = await api.sendChatEvent(conversationId, 'request_photos', { listing_id: item.id });
                    // Optionally add the agent's response to the chat
                    setMessages(prev => [...prev, { type: 'assistant', content: result.response, recommendations: result.recommendations || [] }]);
                    startPhotoPolling(item.id); // Keep polling for visual updates
                  } catch (error) {
                    console.error("Error requesting photos:", error);
                    alert("Sorry, we couldn't request photos right now.");
                  }
                }}
                className="flex-1 bg-orange-600 text-white py-2.5 px-2 rounded-xl hover:bg-orange-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              >
                <Camera className="w-4 h-4" />
                Request Photos
              </button>
            )}
            <button
              onClick={() =>
                window.open(
                  item.details_url || item.bookingLink || item.url,
                  '_blank'
                )
              }
              className="flex-1 bg-blue-600 text-white py-2.5 px-2 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <ExternalLink className="w-4 h-4" />
              {t.book}
            </button>
            <button
            onClick={async () => {
              try {
                const result = await api.sendChatEvent(conversationId, 'contact_agent', { listing_id: item.id });
                // Optionally add the agent's response to the chat
                setMessages(prev => [...prev, { type: 'assistant', content: result.response, recommendations: result.recommendations || [] }]);
              } catch (error) {
                console.error("Error contacting agent:", error);
                alert("Sorry, we couldn't reach the agent right now.");
              }
            }}
            className="flex-1 bg-green-600 text-white py-2.5 px-2 rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
          >
            <Phone className="w-4 h-4" />
            Contact Agent
            </button>
            <button className="p-2 border-2 border-gray-700 rounded-xl hover:border-pink-500 hover:bg-gray-800 transition-all duration-200 group">
              <Heart className="w-5 h-5 text-gray-500 group-hover:text-pink-500 group-hover:fill-pink-500 transition-all duration-200" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Theming helpers
  const pageBgClass = isDark
    ? 'min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black'
    : 'min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100';
  const sidebarShellBg = isDark
    ? 'from-gray-900 via-gray-900 to-black border-gray-800'
    : 'from-white via-white to-gray-50 border-gray-200';
  const sidebarHeaderBg = isDark
    ? 'from-cyan-900/50 via-blue-900/50 to-purple-900/50 border-gray-800'
    : 'from-cyan-100 via-blue-100 to-purple-100 border-gray-200';
  const selectBase = isDark
    ? 'bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800'
    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50';
  const headerClass = isDark
    ? 'bg-gray-900/80 border-gray-800'
    : 'bg-white/80 border-gray-200';
  const headerTitleText = isDark ? 'text-transparent' : 'text-transparent';
  const headerSubText = isDark ? 'text-gray-400' : 'text-gray-600';
  const authText = isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900';
  const authCTA = isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700';
  const chatContainerBg = isDark
    ? 'from-gray-900/90 to-gray-800/90 border-gray-800'
    : 'from-white to-gray-50 border-gray-200';
  const userBubble = isDark
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
    : 'bg-blue-600 text-white';
  const assistantBubble = isDark
    ? 'bg-gray-800/80 border border-gray-700 text-gray-200'
    : 'bg-white border border-gray-200 text-gray-800';
  const proactiveBubble = isDark
    ? 'bg-green-50 border-green-200'
    : 'bg-green-50 border-green-200';
  const inputBox = isDark
    ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-500 hover:bg-gray-800/70'
    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 hover:bg-gray-50';
  const phoneCaptureRow = isDark
    ? 'border-gray-800 from-cyan-900/20 to-blue-900/20'
    : 'border-gray-200 from-cyan-50 to-blue-50';

  return (
    <div className={pageBgClass}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full p-3 shadow-2xl border border-gray-700 hover:shadow-cyan-500/30 transition-all duration-200"
      >
        <Menu className="w-6 h-6 text-cyan-400" />
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-gradient-to-b ${sidebarShellBg} shadow-2xl transform transition-transform duration-300 border-r ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col">
          <div className={`p-6 bg-gradient-to-br ${sidebarHeaderBg} border-b`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-cyan-500/50' : 'shadow-cyan-500/20'}`}>
                  <Compass className={`w-7 h-7 ${isDark ? 'text-white' : 'text-white'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Easy Islander</h1>
                  <p className={`${isDark ? 'text-cyan-300' : 'text-cyan-700'} text-sm`}>Travel Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className={`lg:hidden ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} p-2 rounded-full transition-colors duration-200`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
            
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className={`w-full ${selectBase} border rounded-xl px-4 py-2 text-sm cursor-pointer transition-all duration-200`}
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code} className={isDark ? 'bg-gray-900' : 'bg-white'}>{name}</option>
              ))}
            </select>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeCategory === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleCategoryClick(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                    isActive 
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-cyan-500/20` 
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-white/20' 
                      : `bg-gradient-to-r ${item.gradient}`
                  }`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-sm">
                    {item.label[selectedLanguage] || item.label.en}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t border-gray-800">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Powered by</div>
              <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Easy Islander AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/70 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-80 min-h-screen">
        {/* Header */}
        <header className={`${headerClass} backdrop-blur-lg shadow-lg sticky top-0 z-20`}>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="hidden lg:block">
                <h1 className={`text-3xl font-bold ${headerTitleText} bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500`}>
                  {t.welcomeTitle}
                </h1>
                <p className={`${headerSubText} mt-1`}>{t.welcomeSubtitle}</p>
              </div>
              <div className="lg:hidden">
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Easy Islander</h1>
              </div>
              
              {/* Theme Toggle */}
              <div className="flex items-center gap-2 mr-2">
                <button
                  aria-label="Toggle theme"
                  onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                  className={`p-2 rounded-xl border transition-colors ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              {/* Authentication Section */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Welcome, {user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className={`flex items-center gap-1 px-3 py-1 text-sm ${authText} transition-colors`}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`flex items-center gap-1 px-3 py-1 text-sm ${authCTA} transition-colors`}
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Chat Interface */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className={`bg-gradient-to-br ${chatContainerBg} backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border`}>
            
            <div className="h-96 overflow-y-auto p-8">
              {messages.map((message, index) => {
                if (message.type === 'listing_card') {
                  return (
                    <ListingCard
                      key={index}
                      listing={listingsState[message.listing_id]}
                      conversationId={conversationId}
                      onAgentResponse={(result) => {
                        setMessages(prev => [...prev, { type: 'assistant', content: result.response, recommendations: result.recommendations || [] }]);
                      }}
                      onRequestPhotos={() => handleRequestPhotos(message.listing_id)}
                      onViewPhotos={(images, listingId, verified) => {
                        setGalleryImages(images.map(u => u?.startsWith('http') ? u : `${config.API_BASE_URL}${u.startsWith('/') ? u : '/' + u}`));
                        setGalleryListingId(listingId);
                        setGalleryVerified(verified);
                        setGalleryOpen(true);
                      }}
                    />
                  );
                }
                return (
                  <div key={index} className="mb-8">
                    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.type === 'image_gallery' ? (
                        <ChatImageBubble 
                          message={message} 
                          onRequestPhotos={() => handleRequestPhotos(message.listing_id)} 
                        />
                      ) : (
                        <div
                          className={`max-w-2xl ${
                            message.type === 'user'
                              ? `${userBubble} rounded-l-3xl rounded-tr-3xl shadow-lg shadow-cyan-500/30`
                              : message.proactive 
                                ? `${proactiveBubble} rounded-r-3xl rounded-tl-3xl shadow-sm`
                                : `${assistantBubble} rounded-r-3xl rounded-tl-3xl shadow-lg`
                          } px-6 py-4`}
                        >
                          {message.proactive && (
                            <div className="flex items-center gap-2 mb-2 text-green-600 text-xs font-medium">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Auto-update
                            </div>
                          )}
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                        </div>
                      )}
                    </div>

                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                            <Star className="w-6 h-6 text-white" />
                          </div>
                          {t.recommendations}
                        </h3>
                        <div className="flex gap-6 overflow-x-auto pb-6 -mx-8 px-8">
                          {message.recommendations.map((item) => (
                            <RecommendationCard key={item.id || item.name} item={item} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800/80 border border-gray-700 rounded-r-3xl rounded-tl-3xl shadow-lg px-6 py-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Phone & name capture when AI requests it */}
            {showPhoneInput && (
              <div className={`border-t bg-gradient-to-r ${phoneCaptureRow} p-6`}>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder={t.namePrompt}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className={`flex-1 border rounded-2xl px-4 py-3 text-sm ${isDark ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                  />
                  <input
                    type="tel"
                    placeholder={t.phonePrompt}
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className={`flex-1 border rounded-2xl px-4 py-3 text-sm ${isDark ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                  />
                  <button
                    onClick={() => setShowPhoneInput(false)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg shadow-green-500/30"
                  >
                    <Phone className="w-4 h-4" />
                    Save
                  </button>
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mt-3 text-center`}>We'll contact you for booking assistance!</p>
              </div>
            )}

            <div className="border-t border-gray-800 p-6">
              <div className="flex gap-4">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.placeholder}
                  className={`flex-1 border rounded-2xl px-6 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 ${inputBox}`}
                  rows="2"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-2xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 font-semibold shadow-lg shadow-cyan-500/30 transform hover:scale-105"
                >
                  <Send className="w-5 h-5" />
                  {t.send}
                </button>
              </div>
            </div>
          </div>

          {/* Featured (Per-Category Horizontal Rail) */}
          <div className="mt-12">
            {/* Category Tabs */}
            <div className="flex items-center gap-3 mb-5 overflow-x-auto pb-2">
              {[
                { key: 'car_rental', label: 'Cars', icon: Car, grad: 'from-orange-500 to-pink-600' },
                { key: 'accommodation', label: 'Hotels', icon: Home, grad: 'from-violet-500 to-purple-600' },
                { key: 'activities', label: 'Activities', icon: Camera, grad: 'from-emerald-500 to-teal-600' },
                { key: 'dining', label: 'Restaurants', icon: Utensils, grad: 'from-red-500 to-rose-600' },
              ].map(({ key, label, icon: Icon, grad }) => (
                <button
                  key={key}
                  onClick={() => setFeaturedTab(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-colors ${
                    featuredTab === key
                      ? `bg-gradient-to-r ${grad} text-white border-transparent`
                      : `${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>

            {/* Heading based on selected tab */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                {featuredTab === 'car_rental' && 'Featured Cars'}
                {featuredTab === 'accommodation' && 'Featured Hotels'}
                {featuredTab === 'activities' && 'Featured Activities'}
                {featuredTab === 'dining' && 'Featured Restaurants'}
              </h2>
            </div>

            {/* Single horizontal rail for the selected category */}
            <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6">
              {featuredLoading && <div className="text-sm text-gray-500">Loading…</div>}
              {featuredError && <div className="text-sm text-red-400">{featuredError}</div>}
              {(featured[featuredTab] || []).slice(0, 3).map((item) => (
                <RecommendationCard key={`f-${featuredTab}-${item.id}`} item={item} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-12 mb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { 
                key: 'car_rental', 
                icon: Car, 
                label: { en: 'Rent a Car', ru: 'Арендовать машину', tr: 'Araç Kirala' },
                gradient: 'from-orange-500 to-pink-600',
                description: { en: 'Perfect vehicle for your journey', ru: 'Идеальный автомобиль', tr: 'Mükemmel araç' }
              },
              { 
                key: 'accommodation', 
                icon: Home, 
                label: { en: 'Find Hotels', ru: 'Найти отели', tr: 'Otel Bul' },
                gradient: 'from-violet-500 to-purple-600',
                description: { en: 'Amazing places to stay', ru: 'Удивительные места', tr: 'Harika yerler' }
              },
              { 
                key: 'activities', 
                icon: Camera, 
                label: { en: 'Things to Do', ru: 'Развлечения', tr: 'Yapılacaklar' },
                gradient: 'from-emerald-500 to-teal-600',
                description: { en: 'Explore tours and adventures', ru: 'Туры и приключения', tr: 'Turlar ve maceralar' }
              },
              { 
                key: 'dining', 
                icon: Utensils, 
                label: { en: 'Restaurants', ru: 'Рестораны', tr: 'Restoranlar' },
                gradient: 'from-red-500 to-rose-600',
                description: { en: 'Taste local cuisine', ru: 'Местная кухня', tr: 'Yerel lezzetler' }
              }
            ].map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.key}
                  onClick={() => handleCategoryClick(action.key)}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700/50 rounded-3xl p-6 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 hover:scale-105 transition-all duration-300 flex flex-col items-center gap-4 group"
                >
                  <div className={`p-4 bg-gradient-to-r ${action.gradient} rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/30`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-2">
                      {action.label[selectedLanguage] || action.label.en}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {action.description[selectedLanguage] || action.description.en}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {galleryOpen && (
        <ImageGallery
          images={galleryImages}
          listingId={galleryListingId}
          verified={galleryVerified}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 w-96 max-w-md mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {authMode === 'login' ? 'Login' : 'Register'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full border border-gray-600 rounded-xl px-4 py-3 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full border border-gray-600 rounded-xl px-4 py-3 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full border border-gray-600 rounded-xl px-4 py-3 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full border border-gray-600 rounded-xl px-4 py-3 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-cyan-500/30"
              >
                {authMode === 'login' ? 'Login' : 'Register'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
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
