import axios from 'axios';
import config from './config';

// ℹ️ NOTE: Global axios interceptor is now set up in index.js
// All axios requests automatically include JWT token

const api = {
  getListing: async (listingId) => {
    const response = await axios.get(`${config.API_BASE_URL}/api/listings/${listingId}/`);
    return response.data;
  },

  requestPhotos: async (listingId) => {
    const response = await axios.post(`${config.API_BASE_URL}/api/listings/${listingId}/request-photos/`, {});
    return response.data;
  },

  sendChatEvent: async (conversationId, event, data) => {
    const response = await axios.post(`${config.API_BASE_URL}/api/chat/events/`, {
      conversation_id: conversationId,
      event: event,
      ...data,
    });
    return response.data;
  },
  
  sendChatMessage: async (message, language, conversationId, threadId = null) => {
    const response = await axios.post(
      config.getApiUrl(config.ENDPOINTS.CHAT),
      {
        message,
        language,
        conversation_id: conversationId,
        thread_id: threadId || localStorage.getItem('threadId'),
      },
      {
        withCredentials: true,
      }
    );
    
    if (response.data.thread_id) {
      localStorage.setItem('threadId', response.data.thread_id);
    }
    
    return response.data;
  },

  getRecommendations: async (category, language) => {
    const response = await axios.get(config.getApiUrl(config.ENDPOINTS.RECOMMENDATIONS), {
      params: { category, language },
    });
    return response.data;
  },

  // F.3 - Threads API
  getThreads: async (page = 1, limit = 20) => {
    const response = await axios.get(config.getApiUrl(config.ENDPOINTS.THREADS.LIST), {
      params: { page, limit },
    });
    return response.data; // { results, page, limit, has_next }
  },
};

export default api;
