// frontend/src/components/chat/EasyIslanders.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, MapPin, Star, Car, Home, Camera, Utensils, ShoppingBag, Heart, ExternalLink } from 'lucide-react';
import axios from 'axios'; // Make sure axios is imported

const EasyIslanders = () => {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: 'Welcome to Easy Islanders! I am your personal assistant for anything you need in North Cyprus. How can I help you today?',
      language: 'en',
      recommendations: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Live API Call ---
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      language: selectedLanguage
    };

    // Add user's message to the chat immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // ** THIS IS THE REAL API CALL TO YOUR DJANGO BACKEND **
      const response = await axios.post('http://127.0.0.1:8000/api/chat/', {
        message: inputMessage,
        language: selectedLanguage,
      });

      const apiData = response.data;
      
      const assistantMessage = {
        type: 'assistant',
        content: apiData.response,
        language: apiData.language,
        recommendations: apiData.recommendations || [],
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (apiData.requires_phone) {
        setShowPhoneInput(true);
      }

    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage = {
        type: 'assistant',
        content: 'Sorry, I am having trouble connecting to my services right now. Please try again in a moment.',
        language: selectedLanguage,
        recommendations: [],
      };
      setMessages(prev => [...prev, errorMessage]);
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
    tr: 'Türkçe' // Added Turkish
  };

  const categoryIcons = {
    car_rental: Car,
    accommodation: Home,
    activities: Camera,
    dining: Utensils,
    shopping: ShoppingBag,
    // Add icons for your new categories
    find_rental_property: Home,
    find_used_car: Car,
  };

  const translations = {
    en: {
      placeholder: "Ask me anything about North Cyprus...",
      phonePrompt: "Phone number for assistance",
      namePrompt: "Your name (optional)",
      send: "Send",
      book: "View Details", // Changed for monetization
      recommendations: "Here's what I found for you:",
      rating: "Rating",
      features: "Features",
      priceFrom: "From"
    },
    // Add other languages here
  };

  const t = translations[selectedLanguage] || translations.en;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const RecommendationCard = ({ item }) => {
    // This card is now more flexible to handle different data structures
    const isInternalService = 'category' in item;
    const isScrapedProperty = item.source?.includes('101evler') || item.source?.includes('hangiev');
    const isScrapedCar = item.source?.includes('kktcarabam');
    const isFacebook = item.source?.includes('Facebook');
    
    // Default image if none is provided
    const imageUrl = item.image_url || item.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop";

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 w-80 flex-shrink-0">
        <div className="relative">
          <img src={imageUrl} alt={item.title || item.name} className="w-full h-48 object-cover"/>
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
              <h3 className="font-semibold text-gray-900 text-lg">{item.title || item.name}</h3>
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {item.location || "North Cyprus"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-blue-600 font-bold text-lg">{item.price || item.price_range}</div>
              <div className="text-gray-500 text-xs">{item.source || t.priceFrom}</div>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">{item.description}</p>
          
          {item.features && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-700 mb-2">{t.features}:</div>
              <div className="flex flex-wrap gap-1">
                {item.features.map((feature, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {typeof feature === 'object' ? feature.name : feature}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={() => window.open(item.details_url || item.bookingLink || item.url, '_blank')}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {t.book}
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
                <h1 className="text-2xl font-bold text-gray-900">Easy Islanders</h1>
                <p className="text-sm text-gray-600">Your North Cyprus Action Agent</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <select 
                value={selectedLanguage} 
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          
          <div className="h-[32rem] overflow-y-auto p-6 bg-gray-50"> {/* Increased height */}
            {messages.map((message, index) => (
              <div key={index} className="mb-6">
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl' 
                      : 'bg-white border rounded-r-xl rounded-tl-xl shadow-sm'
                  } px-4 py-3`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>

                {message.recommendations && message.recommendations.length > 0 && (
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
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showPhoneInput && (
            {/* Phone input logic here */}
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

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'car_rental', icon: Car, label: { en: 'Rent a Car', ru: 'Арендовать машину' } },
            { key: 'accommodation', icon: Home, label: { en: 'Find Rentals', ru: 'Найти жилье' } },
            { key: 'activities', icon: Camera, label: { en: 'Things to Do', ru: 'Развлечения' } },
            { key: 'dining', icon: Utensils, label: { en: 'Restaurants', ru: 'Рестораны' } }
          ].map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => setInputMessage(action.label[selectedLanguage] || action.label.en)}
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
    </div>
  );
};

export default EasyIslanders;