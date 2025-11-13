import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import HomePage from './pages/HomePage';
import { AuthProvider } from './shared/context/AuthContext';
import { UiProvider } from './shared/context/UiContext';
import { ChatProvider } from './shared/context/ChatContext';
import './main.css'; // ensure tailwind is imported here

// ✅ GLOBAL AXIOS INTERCEPTOR - Inject auth token for all requests
axios.interceptors.request.use((axiosConfig) => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) {
    axiosConfig.headers.Authorization = `Bearer ${token}`;
  }
  return axiosConfig;
}, (error) => {
  return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <UiProvider>
      <ChatProvider>
        <HomePage />
      </ChatProvider>
    </UiProvider>
  </AuthProvider>
);