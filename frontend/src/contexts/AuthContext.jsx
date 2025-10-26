import React, { createContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [selectedUserType, setSelectedUserType] = useState(null);
  const [authStep, setAuthStep] = useState('type'); // 'type' -> 'form' -> 'complete'
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // F.3 - Add unreadCount state

  const handleLogin = useCallback(async (credentials) => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      const response = await axios.post(config.getApiUrl(config.ENDPOINTS.AUTH.LOGIN), credentials);
      
      // Store JWT token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refresh', response.data.refresh);
      }
      
      setIsAuthenticated(true);
      setUser({
        id: response.data.user.id,
        username: response.data.user.username,
        email: response.data.user.email,
        user_type: response.data.user.user_type || 'consumer'
      });
      setShowAuthModal(false);
      setAuthStep('type');
      setSelectedUserType(null);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleRegister = useCallback(async (userData) => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      // Include user_type from selectedUserType
      const payload = {
        ...userData,
        user_type: selectedUserType || 'consumer'
      };
      const response = await axios.post(config.getApiUrl(config.ENDPOINTS.AUTH.REGISTER), payload);
      
      // Store JWT token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refresh', response.data.refresh);
      }
      
      setIsAuthenticated(true);
      setUser({
        id: response.data.user.id,
        username: response.data.user.username,
        email: response.data.user.email,
        user_type: response.data.user.user_type || selectedUserType || 'consumer'
      });
      setShowAuthModal(false);
      setAuthStep('type');
      setSelectedUserType(null);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setAuthLoading(false);
    }
  }, [selectedUserType]);

  const handleLogout = useCallback(async () => {
    try {
      await axios.post(config.getApiUrl(config.ENDPOINTS.AUTH.LOGOUT));
      // Clear JWT tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      setIsAuthenticated(false);
      setUser(null);
      setAuthError(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear tokens even if logout request fails
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthMode(mode);
    setAuthStep(mode === 'register' ? 'type' : 'form');
    setSelectedUserType(null);
    setAuthError(null);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setAuthStep('type');
    setSelectedUserType(null);
    setAuthError(null);
  }, []);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Set authenticated state but don't fetch user data yet
      // User data will be fetched when needed
      setIsAuthenticated(true);
    }
  }, []);

  const value = {
    isAuthenticated,
    user,
    showAuthModal,
    authMode,
    selectedUserType,
    authStep,
    authError,
    authLoading,
    unreadCount, // F.3 - Expose unreadCount
    setUnreadCount, // F.3 - Expose setter
    setAuthMode,
    setSelectedUserType,
    setAuthStep,
    setShowAuthModal,
    handleLogin,
    handleRegister,
    handleLogout,
    openAuthModal,
    closeAuthModal
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
