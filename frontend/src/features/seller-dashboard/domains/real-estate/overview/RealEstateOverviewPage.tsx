import React from 'react';
import {
  Building2,
  MapPin,
  TrendingUp,
  DollarSign,
  GitBranch,
  Inbox,
  Calendar,
  Wrench,
  Users,
  Tag,
  Radio,
  Hammer,
} from 'lucide-react';
import { SectionNavigationCard } from './components/SectionNavigationCard';

const RealEstateOverviewPage: React.FC = () => {
  const sections = [
    {
      title: 'Portfolio',
      description: 'View and manage your complete property inventory',
      icon: Building2,
      path: '/dashboard/home/real-estate/portfolio',
      stats: [
        { label: 'Total Units', value: '24' },
        { label: 'Available', value: '6' },
      ],
    },
    {
      title: 'Location',
      description: 'Geographic performance and market insights',
      icon: MapPin,
      path: '/dashboard/home/real-estate/location',
      stats: [
        { label: 'Markets', value: '5' },
        { label: 'Top Area', value: 'Kyrenia' },
      ],
    },
    {
      title: 'Occupancy',
      description: 'Track utilization rates and vacancy trends',
      icon: TrendingUp,
      path: '/dashboard/home/real-estate/occupancy',
      stats: [
        { label: 'Current Rate', value: '92%' },
        { label: 'Vacant Units', value: '2' },
      ],
    },
    {
      title: 'Earnings',
      description: 'Revenue, payouts, and financial performance',
      icon: DollarSign,
      path: '/dashboard/home/real-estate/earnings',
      stats: [
        { label: 'MTD Revenue', value: '€12.5K' },
        { label: 'YTD Revenue', value: '€142K' },
      ],
    },
    {
      title: 'Sales Pipeline',
      description: 'Manage leads, viewings, and deal progression',
      icon: GitBranch,
      path: '/dashboard/home/real-estate/sales-pipeline',
      stats: [
        { label: 'Active Leads', value: '18' },
        { label: 'Offers', value: '3' },
      ],
    },
    {
      title: 'Requests',
      description: 'Handle booking and viewing enquiries',
      icon: Inbox,
      path: '/dashboard/home/real-estate/requests',
      stats: [
        { label: 'New Requests', value: '7' },
        { label: 'Response Time', value: '45m' },
      ],
    },
    {
      title: 'Calendar',
      description: 'Bookings, check-ins, viewings, and tasks',
      icon: Calendar,
      path: '/dashboard/home/real-estate/calendar',
      stats: [
        { label: 'Today's Check-ins', value: '3' },
        { label: 'Viewings This Week', value: '5' },
      ],
    },
    {
      title: 'Maintenance',
      description: 'Track repairs, inspections, and service tickets',
      icon: Wrench,
      path: '/dashboard/home/real-estate/maintenance',
      stats: [
        { label: 'Open Tickets', value: '4' },
        { label: 'Avg Resolution', value: '2.3d' },
      ],
    },
    {
      title: 'Owners & Tenants',
      description: 'Manage relationships and lease tracking',
      icon: Users,
      path: '/dashboard/home/real-estate/owners-and-tenants',
      stats: [
        { label: 'Property Owners', value: '12' },
        { label: 'Active Tenants', value: '18' },
      ],
    },
    {
      title: 'Pricing & Promotions',
      description: 'Optimize rates and run discount campaigns',
      icon: Tag,
      path: '/dashboard/home/real-estate/pricing-and-promotions',
      stats: [
        { label: 'Active Promos', value: '2' },
        { label: 'AI Suggestions', value: '6' },
      ],
    },
    {
      title: 'Channels & Distribution',
      description: 'Multi-channel performance and listings',
      icon: Radio,
      path: '/dashboard/home/real-estate/channels-and-distribution',
      stats: [
        { label: 'Active Channels', value: '4' },
        { label: 'Top Channel', value: 'Direct' },
      ],
    },
    {
      title: 'Projects',
      description: 'Off-plan developments and new constructions',
      icon: Hammer,
      path: '/dashboard/home/real-estate/projects',
      stats: [
        { label: 'Active Projects', value: '2' },
        { label: 'Units Available', value: '45' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Real Estate Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Complete overview of your property operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sections.map((section) => (
          <SectionNavigationCard
            key={section.path}
            title={section.title}
            description={section.description}
            icon={section.icon}
            stats={section.stats}
            path={section.path}
          />
        ))}
      </div>
    </div>
  );
};

export default RealEstateOverviewPage;
