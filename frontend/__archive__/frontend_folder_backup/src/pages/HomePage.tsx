import React from 'react';
import { AppShell } from '../app/AppShell';
import { ChatPane } from '../features/chat/ChatPane';
import { FeaturedPane } from '../features/featured/FeaturedPane';

export default function HomePage() {
  return (
    <AppShell>
      <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-0 flex flex-col w-full max-w-[1100px] mx-auto">
        <ChatPane />
        <FeaturedPane />
      </section>
    </AppShell>
  );
}