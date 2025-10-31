import React from 'react';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}