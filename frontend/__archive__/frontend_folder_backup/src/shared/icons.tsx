import React from 'react';
let Lucide: any = {};
try {
  // If lucide-react is installed, this works; otherwise we fallback
  Lucide = require('lucide-react');
} catch {}

export const Icon = ({ name, className }: { name: string; className?: string }) => {
  const Cmp = Lucide?.[name] || ((props: any) => <span {...props}>🔹</span>);
  return <Cmp className={className} />;
};