import axios from 'axios';
import config from './config';

/**
 * Central axios client used across the frontend.
 * Handles auth header injection and base URL configuration.
 */
const http = axios.create({
  baseURL: config.API_BASE_URL,
  // JWT-based auth does not need cookies; avoid CSRF coupling in dev
  withCredentials: false,
});

http.interceptors.request.use(
  (request) => {
    const url = request.url || '';
    // Skip attaching Authorization for auth endpoints
    const isAuthEndpoint =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/google') ||
      url.includes('/api/auth/facebook') ||
      url.includes('/api/auth/logout');

    if (!isAuthEndpoint) {
      const token =
        localStorage.getItem('token') || localStorage.getItem('access_token');
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
      }
      // Correlate requests if we have a prior request id or traceparent
      const reqId = localStorage.getItem('x_request_id');
      if (reqId) {
        request.headers['X-Request-ID'] = reqId;
      }
      const tp = localStorage.getItem('traceparent');
      if (tp) {
        request.headers['traceparent'] = tp;
      }
    }
    return request;
  },
  (error) => Promise.reject(error)
);

// Capture correlation headers from responses for subsequent calls
http.interceptors.response.use(
  (response) => {
    try {
      const reqId = response.headers['x-request-id'] || response.headers['X-Request-ID'];
      if (reqId) localStorage.setItem('x_request_id', reqId);
      const tp = response.headers['traceparent'] || response.headers['Traceparent'];
      if (tp) localStorage.setItem('traceparent', tp);
    } catch (e) {
      // noop
    }
    return response;
  },
  (error) => Promise.reject(error)
);

const api = {
  getListing: async (listingId) => {
    const response = await http.get(`/api/listings/${listingId}/`);
    return response.data;
  },

  requestPhotos: async (listingId) => {
    const response = await http.post(`/api/listings/${listingId}/request-photos/`, {});
    return response.data;
  },

  sendChatEvent: async (conversationId, event, data) => {
    const response = await http.post(`/api/chat/events/`, {
      conversation_id: conversationId,
      event,
      ...data,
    });
    return response.data;
  },

  sendChatMessage: async (message, language, conversationId, threadId = null) => {
    const response = await http.post(config.ENDPOINTS.CHAT, {
      message,
      language,
      conversation_id: conversationId,
      thread_id: threadId || localStorage.getItem('threadId'),
    });

    if (response.data.thread_id) {
      localStorage.setItem('threadId', response.data.thread_id);
    }

    return response.data;
  },

  getRecommendations: async (category, language) => {
    const response = await http.get(config.ENDPOINTS.RECOMMENDATIONS, {
      params: { category, language },
    });
    return response.data;
  },

  // F.3 - Threads API
  getThreads: async (page = 1, limit = 20) => {
    const response = await http.get(config.ENDPOINTS.THREADS.LIST, {
      params: { page, limit },
    });
    return response.data; // { results, page, limit, has_next }
  },
};

export default api;
export { http };
