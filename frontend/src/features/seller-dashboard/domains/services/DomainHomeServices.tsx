import React, { useState } from 'react';
import { 
  Wrench, 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Star, 
  MessageSquare,
  CheckCircle,
  Plus,
  Settings,
  BarChart3,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/context/AuthContext';
import BookingList from '@/features/bookings/components/BookingList';
import ServiceBookingForm from '@/features/bookings/components/forms/ServiceBookingForm';

export const DomainHomeServices: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const qc = useQueryClient();
  const { isAuthenticated, user, openAuthModal } = useAuth();

  const handleCreateBooking = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!user || user.user_type !== 'business') {
      openAuthModal('register');
      return;
    }
    setShowBookingForm(true);
  };

  const serviceSections = [
    {
      id: 'bookings',
      icon: Calendar,
      title: 'Service Bookings',
      description: 'Manage customer bookings and appointments',
      stats: [
        { label: 'Today\'s Bookings', value: '8' },
        { label: 'This Week', value: '45' },
        { label: 'Completion Rate', value: '94%' }
      ],
      color: 'bg-blue-500'
    },
    {
      id: 'providers',
      icon: Users,
      title: 'Service Providers',
      description: 'Manage your team of service professionals',
      stats: [
        { label: 'Active Providers', value: '12' },
        { label: 'Available Now', value: '7' },
        { label: 'Avg Rating', value: '4.8★' }
      ],
      color: 'bg-green-500'
    },
    {
      id: 'schedule',
      icon: Clock,
      title: 'Scheduling',
      description: 'Optimize schedules and availability',
      stats: [
        { label: 'Open Slots', value: '23' },
        { label: 'Peak Hours', value: '2-6 PM' },
        { label: 'Utilization', value: '78%' }
      ],
      color: 'bg-purple-500'
    },
    {
      id: 'coverage',
      icon: MapPin,
      title: 'Service Areas',
      description: 'Manage service coverage and travel zones',
      stats: [
        { label: 'Coverage Areas', value: '5' },
        { label: 'Travel Radius', value: '25km' },
        { label: 'Response Time', value: '45min' }
      ],
      color: 'bg-orange-500'
    },
    {
      id: 'performance',
      icon: TrendingUp,
      title: 'Performance',
      description: 'Track service quality and customer satisfaction',
      stats: [
        { label: 'Customer Rating', value: '4.9★' },
        { label: 'Repeat Customers', value: '68%' },
        { label: 'Avg Job Time', value: '2.5hrs' }
      ],
      color: 'bg-emerald-500'
    },
    {
      id: 'earnings',
      icon: DollarSign,
      title: 'Earnings',
      description: 'Revenue, pricing, and financial insights',
      stats: [
        { label: 'This Month', value: '€12,300' },
        { label: 'Avg Job Value', value: '€185' },
        { label: 'Growth', value: '+15%' }
      ],
      color: 'bg-indigo-500'
    },
    {
      id: 'reviews',
      icon: Star,
      title: 'Reviews & Ratings',
      description: 'Customer feedback and service ratings',
      stats: [
        { label: 'Total Reviews', value: '156' },
        { label: '5-Star Reviews', value: '134' },
        { label: 'Response Rate', value: '100%' }
      ],
      color: 'bg-yellow-500'
    },
    {
      id: 'communication',
      icon: MessageSquare,
      title: 'Customer Communication',
      description: 'Manage customer interactions and support',
      stats: [
        { label: 'Unread Messages', value: '3' },
        { label: 'Avg Response Time', value: '12min' },
        { label: 'Satisfaction', value: '96%' }
      ],
      color: 'bg-pink-500'
    }
  ];

  const serviceTypes = [
    { name: 'Plumbing', icon: '🚰', count: 45, color: 'bg-blue-100 text-blue-800' },
    { name: 'Electrical', icon: '⚡', count: 32, color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Cleaning', icon: '🧹', count: 78, color: 'bg-green-100 text-green-800' },
    { name: 'Carpentry', icon: '🪚', count: 23, color: 'bg-amber-100 text-amber-800' },
    { name: 'HVAC', icon: '❄️', count: 19, color: 'bg-cyan-100 text-cyan-800' },
    { name: 'Landscaping', icon: '🌱', count: 15, color: 'bg-emerald-100 text-emerald-800' }
  ];

  const recentBookings = [
    {
      id: 'BK001',
      service: 'Emergency Plumbing',
      customer: 'John Smith',
      date: 'Today, 2:00 PM',
      status: 'confirmed',
      amount: '€150'
    },
    {
      id: 'BK002',
      service: 'AC Repair',
      customer: 'Sarah Johnson',
      date: 'Today, 4:30 PM',
      status: 'in-progress',
      amount: '€200'
    },
    {
      id: 'BK003',
      service: 'Garden Maintenance',
      customer: 'Mike Davis',
      date: 'Tomorrow, 9:00 AM',
      status: 'pending',
      amount: '€85'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Services Dashboard</h1>
            <p className="text-slate-600">Manage your service business operations</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateBooking}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
          <Button
            variant="outline"
            className="rounded-xl border-slate-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Today's Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">8</div>
            <div className="flex items-center gap-1 text-sm text-emerald-600 mt-1">
              <CheckCircle className="w-3 h-3" />
              <span>All confirmed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Active Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">12</div>
            <div className="flex items-center gap-1 text-sm text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>7 available now</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Customer Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">4.9</div>
            <div className="flex items-center gap-1 text-sm text-amber-600 mt-1">
              <Star className="w-3 h-3 fill-current" />
              <span>156 reviews</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">€12,300</div>
            <div className="flex items-center gap-1 text-sm text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+15% this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Types */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {serviceTypes.map((service) => (
          <Card key={service.name} className="border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{service.icon}</span>
                  <h3 className="font-semibold text-slate-900">{service.name}</h3>
                </div>
                <Badge className={service.color}>{service.count}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Active bookings</span>
                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Bookings */}
      <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Button variant="ghost" size="sm" className="text-indigo-600">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{booking.service}</h4>
                    <p className="text-sm text-slate-600">{booking.customer}</p>
                    <p className="text-xs text-slate-500">{booking.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{booking.amount}</div>
                    <Badge 
                      className={`text-xs ${
                        booking.status === 'confirmed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : booking.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {booking.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Create New Service Booking</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBookingForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <ServiceBookingForm
                data={{}}
                onChange={(field, value) => console.log('Booking form change:', field, value)}
                errors={{}}
              />
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowBookingForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log('Create booking');
                    setShowBookingForm(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
                >
                  Create Booking
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
