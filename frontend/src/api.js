import axios from 'axios';
import config from './config';
import { getAccessToken } from './auth/tokenStore';

/**
 * Central axios client used across the frontend.
 * Handles auth header injection and base URL configuration.
 *
 * Single source of truth for API calls.
 * Reads base URL from config (env-aware).
 * Optional withCredentials enabled when we switch to HttpOnly cookies.
 */
const http = axios.create({
  baseURL: config.API_BASE_URL,
  // Cookie-based auth requires credentials; ensures HttpOnly JWT cookies are sent
  withCredentials: true,
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
      const token = getAccessToken();
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

  // Preferences API
  getActivePreferences: async (category = 'real_estate', minConfidence = 0.5) => {
    const response = await http.get('/api/preferences/active/', {
      params: { category, min_confidence: minConfidence },
    });
    return response.data; // { preferences: { real_estate: [...] } }
  },

  setThreadPersonalization: async (threadId, paused) => {
    const response = await http.put(`/api/chat/thread/${threadId}/personalization/`, { paused });
    return response.data; // { ok, thread_id, paused }
  },
  getThreadPersonalization: async (threadId) => {
    const response = await http.get(`/api/chat/thread/${threadId}/personalization/state/`);
    return response.data; // { ok, thread_id, paused }
  },

  upsertPreference: async (payload) => {
    const response = await http.post('/api/preferences/', payload);
    return response.data; // { ok, preference }
  },

  // Seller Dashboard APIs
  getSellerProfile: async () => {
    const response = await http.get('/api/sellers/me/');
    return response.data;
  },

  getSellerAnalytics: async () => {
    const response = await http.get('/api/sellers/analytics/');
    return response.data;
  },

  // Buyer Requests APIs
  getBuyerRequests: async (params = {}) => {
    const response = await http.get('/api/buyer-requests/', { params });
    return response.data;
  },

  getMyBuyerRequests: async () => {
    const response = await http.get('/api/buyer-requests/my-requests/');
    return response.data;
  },

  createBuyerRequest: async (data) => {
    const response = await http.post('/api/buyer-requests/', data);
    return response.data;
  },

  updateBuyerRequest: async (id, data) => {
    const response = await http.patch(`/api/buyer-requests/${id}/`, data);
    return response.data;
  },

  deleteBuyerRequest: async (id) => {
    const response = await http.delete(`/api/buyer-requests/${id}/`);
    return response.data;
  },

  // Broadcasts APIs
  getBroadcasts: async (params = {}) => {
    const response = await http.get('/api/broadcasts/', { params });
    return response.data;
  },

  getMyBroadcasts: async () => {
    const response = await http.get('/api/broadcasts/my-broadcasts/');
    return response.data;
  },

  createBroadcast: async (data) => {
    const response = await http.post('/api/broadcasts/', data);
    return response.data;
  },

  updateBroadcast: async (id, data) => {
    const response = await http.patch(`/api/broadcasts/${id}/`, data);
    return response.data;
  },

  deleteBroadcast: async (id) => {
    const response = await http.delete(`/api/broadcasts/${id}/`);
    return response.data;
  },

  publishBroadcast: async (id) => {
    const response = await http.post(`/api/broadcasts/${id}/publish/`);
    return response.data;
  },

  incrementBroadcastView: async (id) => {
    const response = await http.post(`/api/broadcasts/${id}/increment-view/`);
    return response.data;
  },
};

export default api;
export { http };
