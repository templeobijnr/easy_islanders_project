import React from 'react';
let Lucide: any = {};
try {
  // If lucide-react is installed, this works; otherwise we fallback
  Lucide = require('lucide-react');
} catch {}

// Export individual icons for direct import
export const User = Lucide?.User || ((props: any) => <span {...props}>👤</span>);
export const MessageCircle = Lucide?.MessageCircle || ((props: any) => <span {...props}>💬</span>);
export const Shield = Lucide?.Shield || ((props: any) => <span {...props}>🛡️</span>);
export const Award = Lucide?.Award || ((props: any) => <span {...props}>🏆</span>);
export const Users = Lucide?.Users || ((props: any) => <span {...props}>👥</span>);
export const Star = Lucide?.Star || ((props: any) => <span {...props}>⭐</span>);
export const Send = Lucide?.Send || ((props: any) => <span {...props}>📤</span>);
export const Settings = Lucide?.Settings || ((props: any) => <span {...props}>⚙️</span>);
export const ChevronLeft = Lucide?.ChevronLeft || ((props: any) => <span {...props}>⬅️</span>);
export const ChevronRight = Lucide?.ChevronRight || ((props: any) => <span {...props}>➡️</span>);
export const ExternalLink = Lucide?.ExternalLink || ((props: any) => <span {...props}>🔗</span>);
export const Phone = Lucide?.Phone || ((props: any) => <span {...props}>📞</span>);
export const Mail = Lucide?.Mail || ((props: any) => <span {...props}>✉️</span>);
export const Search = Lucide?.Search || ((props: any) => <span {...props}>🔍</span>);
export const Paperclip = Lucide?.Paperclip || ((props: any) => <span {...props}>📎</span>);
export const Heart = Lucide?.Heart || ((props: any) => <span {...props}>❤️</span>);
export const MapPin = Lucide?.MapPin || ((props: any) => <span {...props}>📍</span>);

// Generic icon component
export const Icon = ({ name, className }: { name: string; className?: string }) => {
  const Cmp = Lucide?.[name] || ((props: any) => <span {...props}>🔹</span>);
  return <Cmp className={className} />;
};