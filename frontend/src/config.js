// Frontend configuration for Easy Islanders
const config = {
  // API Configuration - Django server base URL
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Features
  FEATURES: {
    AUTHENTICATION: process.env.REACT_APP_ENABLE_AUTH !== 'false',
    BOOKING: process.env.REACT_APP_ENABLE_BOOKING !== 'false',
    MULTILINGUAL: process.env.REACT_APP_ENABLE_MULTILINGUAL !== 'false',
    PREFS_UI: process.env.REACT_APP_PREFS_UI_ENABLED !== 'false',
  },
  
  // Languages
  SUPPORTED_LANGUAGES: ['en', 'tr', 'ru', 'pl', 'de'],
  DEFAULT_LANGUAGE: 'en',
  
  // UI Configuration
  UI: {
    THEME: process.env.REACT_APP_THEME || 'light',
    PRIMARY_COLOR: process.env.REACT_APP_PRIMARY_COLOR || '#3B82F6',
    SECONDARY_COLOR: process.env.REACT_APP_SECONDARY_COLOR || '#10B981',
  },
  
  // API Endpoints
  ENDPOINTS: {
    CHAT: '/api/chat/',
    RECOMMENDATIONS: '/api/recommendations/',
    // F.3 API Contract V1.0 Endpoints
    MESSAGES: {
      GET_MESSAGES: '/api/v1/messages/',
      UNREAD_COUNT: '/api/v1/messages/unread-count/',
      MARK_READ: (threadId) => `/api/v1/messages/${threadId}/read_status/`,
    },
    THREADS: {
      LIST: '/api/v1/threads/',
    },
    AUTH: {
      REGISTER: '/api/auth/register/',
      LOGIN: '/api/auth/login/',
      LOGOUT: '/api/auth/logout/',
      PROFILE: '/api/auth/profile/',
      STATUS: '/api/auth/status/',
    },
    LISTINGS: {
      OUTREACH: '/api/listings/outreach/',
      DETAILS: '/api/listings/',
      IMAGES: '/api/listings/',
      CARD_DISPLAY: '/api/listings/',
      AUTO_DISPLAY: '/api/listings/',
    },
    WEBHOOKS: {
      TWILIO: '/api/webhooks/twilio/',
    },
  },
  
  // WebSocket Configuration (for real-time updates)
  WEBSOCKET: {
    ENABLED: process.env.REACT_APP_WEBSOCKET_ENABLED !== 'false', // Enabled by default
    // Dynamically set WebSocket URL to match API_BASE_URL port
    get URL() {
      const explicit = process.env.REACT_APP_WS_URL || process.env.REACT_APP_WEBSOCKET_URL;
      if (explicit) return explicit;

      try {
        const apiBase = config.API_BASE_URL;
        const u = new URL(apiBase);
        const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
        // Use origin host:port only, avoid API paths
        return `${wsProto}//${u.host}`;
      } catch (e) {
        // Fallback: attempt simple scheme swap while being lenient
        try {
          const raw = String(config.API_BASE_URL || '').replace(/\/$/, '');
          const parsed = new URL(raw);
          const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
          return `${wsProto}//${parsed.host}`;
        } catch (e2) {
          const raw = String(config.API_BASE_URL || '').replace(/\/$/, '');
          const scheme = raw.startsWith('https') ? 'wss:' : 'ws:';
          return raw.replace(/^https?:/, scheme).split('/').slice(0, 3).join('/');
        }
      }
    },
  },
  
  // Polling Configuration
  POLLING: {
    INTERVAL: parseInt(process.env.REACT_APP_POLLING_INTERVAL) || 5000, // 5 seconds
    ENABLED: process.env.REACT_APP_POLLING_ENABLED !== 'false',
  },
  
  // Error Handling
  ERROR_HANDLING: {
    MAX_RETRIES: parseInt(process.env.REACT_APP_MAX_RETRIES) || 3,
    RETRY_DELAY: parseInt(process.env.REACT_APP_RETRY_DELAY) || 1000, // 1 second
  },
  
  // Development
  DEBUG: process.env.NODE_ENV === 'development',
  
  // Helper functions
  getApiUrl: (endpoint) => {
    return `${config.API_BASE_URL}${endpoint}`;
  },
  
  getWebSocketUrl: () => {
    return config.WEBSOCKET.ENABLED ? config.WEBSOCKET.URL : null;
  },
  
  isFeatureEnabled: (feature) => {
    return config.FEATURES[feature] === true;
  },
  
  getLanguage: () => {
    return localStorage.getItem('selectedLanguage') || config.DEFAULT_LANGUAGE;
  },
  
  setLanguage: (language) => {
    if (config.SUPPORTED_LANGUAGES.includes(language)) {
      localStorage.setItem('selectedLanguage', language);
    }
  },
};

export default config;




