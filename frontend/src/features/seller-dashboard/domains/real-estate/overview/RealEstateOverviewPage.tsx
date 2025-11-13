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
  UserCheck,
  Tag,
  Share2,
  Briefcase,
  Home,
  BarChart3,
} from 'lucide-react';
import { SectionNavigationCard } from './components/SectionNavigationCard';
import { useRealEstateOverview } from '../hooks/useRealEstateDashboard';

export const RealEstateOverviewPage = () => {
  // Fetch overview data (optional - cards will render without it)
  const { data: overview } = useRealEstateOverview();

  const sections = [
    {
      icon: Building2,
      title: 'Portfolio',
      description: 'View and manage your property portfolio',
      to: '/dashboard/home/real-estate/portfolio',
      stats: overview ? [
        { label: 'Total Units', value: overview.total_units },
        { label: 'Occupied', value: overview.units_occupied },
      ] : undefined,
    },
    {
      icon: MapPin,
      title: 'Location Analytics',
      description: 'Performance insights by area and location',
      to: '/dashboard/home/real-estate/location',
    },
    {
      icon: Home,
      title: 'Occupancy',
      description: 'Track occupancy rates and vacancy trends',
      to: '/dashboard/home/real-estate/occupancy',
      stats: overview ? [
        { label: 'Current Rate', value: `${(overview.occupancy_rate * 100).toFixed(0)}%` },
      ] : undefined,
    },
    {
      icon: TrendingUp,
      title: 'Earnings',
      description: 'Revenue, expenses, and financial performance',
      to: '/dashboard/home/real-estate/earnings',
      stats: overview ? [
        { label: 'Monthly Revenue', value: `£${parseFloat(overview.monthly_revenue).toLocaleString()}` },
      ] : undefined,
    },
    {
      icon: BarChart3,
      title: 'Sales Pipeline',
      description: 'Track leads, viewings, and deals in progress',
      to: '/dashboard/home/real-estate/sales-pipeline',
      stats: overview ? [
        { label: 'Active Deals', value: overview.active_deals },
      ] : undefined,
    },
    {
      icon: MessageSquare,
      title: 'Requests & Inquiries',
      description: 'Manage customer requests and communications',
      to: '/dashboard/home/real-estate/requests',
      stats: overview ? [
        { label: 'New Requests', value: overview.new_requests },
      ] : undefined,
    },
    {
      icon: Calendar,
      title: 'Calendar',
      description: 'View bookings, viewings, and scheduled events',
      to: '/dashboard/home/real-estate/calendar',
    },
    {
      icon: Wrench,
      title: 'Maintenance',
      description: 'Track maintenance tickets and work orders',
      to: '/dashboard/home/real-estate/maintenance',
    },
    {
      icon: UserCheck,
      title: 'Owners & Tenants',
      description: 'Manage property owners and tenant relationships',
      to: '/dashboard/home/real-estate/owners-and-tenants',
    },
    {
      icon: Tag,
      title: 'Pricing & Promotions',
      description: 'Smart pricing suggestions and discount campaigns',
      to: '/dashboard/home/real-estate/pricing-and-promotions',
    },
    {
      icon: Share2,
      title: 'Channels & Distribution',
      description: 'Performance across listing platforms',
      to: '/dashboard/home/real-estate/channels-and-distribution',
    },
    {
      icon: Briefcase,
      title: 'Projects',
      description: 'Manage off-plan developments and new builds',
      to: '/dashboard/home/real-estate/projects',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Real Estate Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your property portfolio and business operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, index) => (
          <SectionNavigationCard key={index} {...section} />
        ))}
      </div>
    </div>
  );
};
