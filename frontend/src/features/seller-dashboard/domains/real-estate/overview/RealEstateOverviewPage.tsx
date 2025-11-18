/**
 * Real Estate Dashboard Overview Page
 * Hub for navigating to 13 domain-specific dashboard sections
 */
import {
  Building2,
  MapPin,
  Users,
  TrendingUp,
  MessageSquare,
  Calendar,
  Wrench,
  Trophy,
  Tag,
  Share2,
  Gauge,
  Gem,
} from 'lucide-react';
import { SectionNavigationCard } from './components/SectionNavigationCard';
import { useRealEstateOverview, useRealEstateCalendar } from '../hooks/useRealEstateDashboard';
import { Button } from '@/components/ui/button';
import React from 'react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/context/AuthContext';
import RealEstatePropertyUploadEnhanced from './RealEstatePropertyUploadEnhanced';

export const RealEstateOverviewPage = () => {
  // Fetch overview data (optional - cards will render without it)
  const { data: overview } = useRealEstateOverview();
  const qc = useQueryClient();
  const [openUpload, setOpenUpload] = useState(false);
  const { isAuthenticated, user, openAuthModal } = useAuth();

  const handleCreateProperty = () => {
    // Require authenticated business account before opening uploader
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!user || user.user_type !== 'business') {
      // Prompt to register/upgrade as business
      openAuthModal('register');
      return;
    }
    setOpenUpload(true);
  };

  const sections = [
    {
      icon: Gem,
      title: 'Portfolio',
      description: 'View and manage all your properties in one place',
      to: '/dashboard/home/real-estate/portfolio',
      stats: overview ? [
        { label: 'Total Units', value: overview.total_units },
        { label: 'Occupied', value: overview.units_occupied },
      ] : undefined,
      useHeroUI: true,
    },
    {
      icon: Calendar,
      title: 'Calendar',
      description: 'View bookings, viewings, and scheduled events',
      to: '/dashboard/home/real-estate/calendar',
      useHeroUI: true,
    },
    {
      icon: MessageSquare,
      title: 'Messages',
      description: 'Open your inbox to review conversations',
      to: '/dashboard/messages',
      stats: overview ? [
        { label: 'New', value: overview.new_requests },
      ] : undefined,
      useHeroUI: true,
    },
  ];

  return (
    <div className="relative min-h-screen p-6 lg:p-8">
      {/* Glassy background pane */}
      <div className="fixed inset-0 bg-white/40 backdrop-blur-xl border border-white/20 shadow-2xl -z-10" />
      
      {/* Content container */}
      <div className="relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold font-display text-black">
            Real Estate Dashboard
          </h1>
          <Button
            onClick={handleCreateProperty}
            variant="ghost"
            className="rounded-2xl border border-white/20 bg-white/30 backdrop-blur supports-[backdrop-filter]:bg-white/40 text-black hover:bg-white/50 shadow-sm"
          >
            Add Property
          </Button>
        </div>

        <p className="text-black mt-[-12px] mb-6 text-lg">
          Manage your property portfolio and business operations
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <OverviewPanel overview={overview} />
          {sections.map((section, index) => (
            <SectionNavigationCard key={index} {...section} />
          ))}
        </div>

        <RealEstatePropertyUploadEnhanced
          open={openUpload}
          onOpenChange={setOpenUpload}
          onSuccess={() => {
            // Refresh dashboard data after creating a property
            qc.invalidateQueries({ queryKey: ['real-estate', 'overview'] });
            qc.invalidateQueries({ queryKey: ['real-estate', 'portfolio'] });
          }}
        />
      </div>
    </div>
  );
};

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const OverviewPanel: React.FC<{ overview: any }> = ({ overview }) => {
  const today = new Date();
  const start = formatDate(today);
  const end = formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
  const { data: calendar } = useRealEstateCalendar(start, end);

  const upcoming = Array.isArray(calendar?.events)
    ? calendar.events.slice(0, 5)
    : Array.isArray(calendar)
      ? calendar.slice(0, 5)
      : [];

  const newMessages = overview?.new_requests ?? 0;
  const occupancyRate = overview?.occupancy_rate
    ? `${Math.round(overview.occupancy_rate * 100)}%`
    : '-';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 md:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Today’s Overview</h2>
        <div className="text-xs text-slate-500">Updates and upcoming activities</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-600">New Messages</div>
          <div className="text-2xl font-bold text-lime-600 mt-1">{newMessages}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-600">Occupancy</div>
          <div className="text-2xl font-bold text-lime-600 mt-1">{occupancyRate}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-600">Upcoming (7d)</div>
          <div className="text-2xl font-bold text-lime-600 mt-1">{upcoming.length}</div>
        </div>
      </div>
      {upcoming.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-slate-600 mb-2">Next up</div>
          <div className="space-y-2">
            {upcoming.map((evt: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-slate-200">
                <div className="text-sm text-slate-700 truncate">
                  {evt.title || evt.type || 'Event'}
                </div>
                <div className="text-xs text-slate-500">
                  {evt.date || evt.start || ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
