import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { UiProvider } from './shared/context/UiContext';
import { ChatProvider } from './shared/context/ChatContext';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ✅ GLOBAL AXIOS INTERCEPTOR - Set up after all imports
// This applies to ALL axios requests in the app
axios.interceptors.request.use((axiosConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    axiosConfig.headers.Authorization = `Bearer ${token}`;
  }
  return axiosConfig;
}, (error) => {
  return Promise.reject(error);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <UiProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </UiProvider>
    </AuthProvider>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


