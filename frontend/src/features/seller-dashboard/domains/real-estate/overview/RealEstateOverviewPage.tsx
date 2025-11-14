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
import { useRealEstateOverview } from '../hooks/useRealEstateDashboard';
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
      description: 'View and manage your property portfolio',
      to: '/dashboard/home/real-estate/portfolio',
      stats: overview ? [
        { label: 'Total Units', value: overview.total_units },
        { label: 'Occupied', value: overview.units_occupied },
      ] : undefined,
      useHeroUI: true,
    },
    {
      icon: MapPin,
      title: 'Location Analytics',
      description: 'Performance insights by area and location',
      to: '/dashboard/home/real-estate/location',
      useHeroUI: true,
    },
    {
      icon: Gauge,
      title: 'Occupancy',
      description: 'Track occupancy rates and vacancy trends',
      to: '/dashboard/home/real-estate/occupancy',
      stats: overview ? [
        { label: 'Current Rate', value: `${(overview.occupancy_rate * 100).toFixed(0)}%` },
      ] : undefined,
      useHeroUI: true,
    },
    {
      icon: TrendingUp,
      title: 'Earnings',
      description: 'Revenue, expenses, and financial performance',
      to: '/dashboard/home/real-estate/earnings',
      stats: overview ? [
        { label: 'Monthly Revenue', value: `£${parseFloat(overview.monthly_revenue).toLocaleString()}` },
      ] : undefined,
      useHeroUI: true,
    },
    {
      icon: Trophy,
      title: 'Sales Pipeline',
      description: 'Track leads, viewings, and deals in progress',
      to: '/dashboard/home/real-estate/sales-pipeline',
      stats: overview ? [
        { label: 'Active Deals', value: overview.active_deals },
      ] : undefined,
      useHeroUI: true,
    },
    {
      icon: MessageSquare,
      title: 'Requests & Inquiries',
      description: 'Manage customer requests and communications',
      to: '/dashboard/home/real-estate/requests',
      stats: overview ? [
        { label: 'New Requests', value: overview.new_requests },
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
      icon: Wrench,
      title: 'Maintenance',
      description: 'Track maintenance tickets and work orders',
      to: '/dashboard/home/real-estate/maintenance',
      useHeroUI: true,
    },
    {
      icon: Users,
      title: 'Owners & Tenants',
      description: 'Manage property owners and tenant relationships',
      to: '/dashboard/home/real-estate/owners-and-tenants',
      useHeroUI: true,
    },
    {
      icon: Tag,
      title: 'Pricing & Promotions',
      description: 'Smart pricing suggestions and discount campaigns',
      to: '/dashboard/home/real-estate/pricing-and-promotions',
      useHeroUI: true,
    },
    {
      icon: Share2,
      title: 'Channels & Distribution',
      description: 'Performance across listing platforms',
      to: '/dashboard/home/real-estate/channels-and-distribution',
      useHeroUI: true,
    },
    {
      icon: Building2,
      title: 'Projects',
      description: 'Manage off-plan developments and new builds',
      to: '/dashboard/home/real-estate/projects',
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
