import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AppShell from './app/AppShell';
import AppRoutes from './app/routes';
import { AuthProvider } from './shared/context/AuthContext';
import { UiProvider } from './shared/context/UiContext';
import { ChatProvider } from './shared/context/ChatContext';
import './main.css';

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
  <BrowserRouter>
    <AuthProvider>
      <UiProvider>
        <ChatProvider>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </ChatProvider>
      </UiProvider>
    </AuthProvider>
  </BrowserRouter>
);