import React from 'react';

interface PageProps {
  title?: string;
  children: React.ReactNode;
}

export default function Page({ title, children }: PageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 lg:px-6 py-6">
      {title && <h1 className="text-2xl font-semibold text-slate-800 mb-4">{title}</h1>}
      {children}
    </div>
  );
}
