import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ChatPage from '../features/chat/ChatPage';
import FeaturedPanel from '../features/featured/FeaturedPanel';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<FeaturedPanel />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat/:conversationId" element={<ChatPage />} />
    </Routes>
  );
};

export default AppRoutes;