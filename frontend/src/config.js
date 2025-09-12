// Frontend configuration for Easy Islanders
const config = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Features
  FEATURES: {
    AUTHENTICATION: process.env.REACT_APP_ENABLE_AUTH !== 'false',
    BOOKING: process.env.REACT_APP_ENABLE_BOOKING !== 'false',
    MULTILINGUAL: process.env.REACT_APP_ENABLE_MULTILINGUAL !== 'false',
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
    ENABLED: process.env.REACT_APP_WEBSOCKET_ENABLED === 'true',
    URL: process.env.REACT_APP_WEBSOCKET_URL || 'ws://127.0.0.1:8001/ws/',
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



