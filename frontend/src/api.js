import axios from 'axios';
import config from './config';

const api = {
  getListing: async (listingId) => {
    const response = await fetch(`${config.API_BASE_URL}/api/listings/${listingId}/`);
    if (!response.ok) throw new Error('Failed to fetch listing');
    return response.json();
  },

  requestPhotos: async (listingId) => {
    const response = await fetch(`${config.API_BASE_URL}/api/listings/${listingId}/request-photos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to request photos');
    return response.json();
  },

  sendChatEvent: async (conversationId, event, data) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${config.API_BASE_URL}/api/chat/events/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversation_id: conversationId,
        event: event,
        ...data,
      }),
    });
    if (!response.ok) throw new Error(`Failed to send chat event: ${event}`);
    return response.json();
  },
  
  sendChatMessage: async (message, language, conversationId) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios.post(config.getApiUrl(config.ENDPOINTS.CHAT), {
      message,
      language,
      conversation_id: conversationId
    }, { headers });
    return response.data;
  },

  getRecommendations: async (category, language) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios.get(config.getApiUrl(config.ENDPOINTS.RECOMMENDATIONS), {
      params: { category, language },
      headers
    });
    return response.data;
  },
};

export default api;
