import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './layout/AppShell';
import ChatPage from './features/chat/ChatPage';
import Dashboard from './pages/dashboard/Dashboard';
import Messages from './pages/Messages';
import Requests from './pages/Requests';
import Bookings from './pages/Bookings';
import CreateListing from './pages/CreateListing';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AuthModal from './components/auth/AuthModal';

export default function App() {
  return (
    <>
      <AuthModal />
      <AppShell>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </AppShell>
    </>
  );
}

