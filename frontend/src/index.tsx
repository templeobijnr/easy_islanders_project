import React from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from './pages/HomePage';
import { AuthProvider } from './contexts/AuthContext';
import { UiProvider } from './shared/context/UiContext';
import { ChatProvider } from './shared/context/ChatContext';
import './main.css'; // ensure tailwind is imported here

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <UiProvider>
      <ChatProvider>
        <HomePage />
      </ChatProvider>
    </UiProvider>
  </AuthProvider>
);