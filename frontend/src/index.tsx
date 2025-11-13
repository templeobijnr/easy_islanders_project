import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AppShell from './app/AppShell';
import AppRoutes from './app/routes';
import { AuthProvider } from './shared/context/AuthContext';
import { UiProvider } from './shared/context/UiContext';
import { ChatProvider } from './shared/context/ChatContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

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

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UiProvider>
          <ChatProvider>
            <AppShell>
              <AppRoutes />
            </AppShell>
          </ChatProvider>
        </UiProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
