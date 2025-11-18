import React, { useState } from 'react';
import { 
  Calendar, 
  Ticket, 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Star, 
  MessageSquare,
  Plus,
  Settings,
  BarChart3,
  Music,
  Utensils,
  Camera,
  X,
  Edit3,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/context/AuthContext';

export const DomainHomeEvents: React.FC = () => {
  const [showEventForm, setShowEventForm] = useState(false);
  const qc = useQueryClient();
  const { isAuthenticated, user, openAuthModal } = useAuth();

  const handleCreateEvent = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!user || user.user_type !== 'business') {
      openAuthModal('register');
      return;
    }
    setShowEventForm(true);
  };

  const eventTypes = [
    { name: 'Concerts', icon: '🎵', count: 8, color: 'bg-purple-100 text-purple-800', revenue: '€15,200' },
    { name: 'Conferences', icon: '🎤', count: 5, color: 'bg-blue-100 text-blue-800', revenue: '€8,500' },
    { name: 'Workshops', icon: '🎨', count: 12, color: 'bg-green-100 text-green-800', revenue: '€3,200' },
    { name: 'Food & Drink', icon: '🍽️', count: 6, color: 'bg-orange-100 text-orange-800', revenue: '€5,800' },
    { name: 'Photography', icon: '📸', count: 3, color: 'bg-pink-100 text-pink-800', revenue: '€2,100' },
    { name: 'Networking', icon: '🤝', count: 7, color: 'bg-indigo-100 text-indigo-800', revenue: '€4,200' }
  ];

  const upcomingEvents = [
    {
      id: 'EV001',
      title: 'Summer Music Festival',
      type: 'Concert',
      date: 'July 15, 2024',
      time: '7:00 PM',
      venue: 'City Amphitheater',
      ticketsSold: 450,
      capacity: 500,
      status: 'selling',
      revenue: '€22,500'
    },
    {
      id: 'EV002',
      title: 'Tech Conference 2024',
      type: 'Conference',
      date: 'August 20, 2024',
      time: '9:00 AM',
      venue: 'Convention Center',
      ticketsSold: 180,
      capacity: 200,
      status: 'selling',
      revenue: '€36,000'
    },
    {
      id: 'EV003',
      title: 'Wine Tasting Experience',
      type: 'Food & Drink',
      date: 'July 22, 2024',
      time: '6:00 PM',
      venue: 'Downtown Winery',
      ticketsSold: 25,
      capacity: 30,
      status: 'limited',
      revenue: '€1,250'
    }
  ];

  const recentBookings = [
    {
      id: 'BK001',
      event: 'Summer Music Festival',
      customer: 'Emma Wilson',
      tickets: 2,
      date: 'Today, 2:30 PM',
      status: 'confirmed',
      amount: '€100'
    },
    {
      id: 'BK002',
      event: 'Tech Conference 2024',
      customer: 'James Brown',
      tickets: 1,
      date: 'Today, 11:15 AM',
      status: 'confirmed',
      amount: '€180'
    },
    {
      id: 'BK003',
      event: 'Photography Workshop',
      customer: 'Lisa Chen',
      tickets: 3,
      date: 'Yesterday, 4:45 PM',
      status: 'pending',
      amount: '€225'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Events Dashboard</h1>
            <p className="text-slate-600">Manage your events and ticket sales</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateEvent}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
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
            <CardTitle className="text-sm font-medium text-slate-600">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">12</div>
            <div className="flex items-center gap-1 text-sm text-emerald-600 mt-1">
              <Calendar className="w-3 h-3" />
              <span>Next 30 days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Tickets Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">1,847</div>
            <div className="flex items-center gap-1 text-sm text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>↑ 23% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">€28,450</div>
            <div className="flex items-center gap-1 text-sm text-emerald-600 mt-1">
              <DollarSign className="w-3 h-3" />
              <span>This month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">87%</div>
            <div className="flex items-center gap-1 text-sm text-amber-600 mt-1">
              <Users className="w-3 h-3" />
              <span>Capacity filled</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Types Performance */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {eventTypes.map((event) => (
          <Card key={event.name} className="border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{event.icon}</span>
                  <h3 className="font-semibold text-slate-900">{event.name}</h3>
                </div>
                <Badge className={event.color}>{event.count}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Active Events</span>
                  <span className="font-medium">{event.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Revenue</span>
                  <span className="font-medium text-emerald-600">{event.revenue}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                  <Eye className="w-4 h-4 mr-1" />
                  View Events
                </Button>
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                  <Edit3 className="w-4 h-4 mr-1" />
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Events */}
      <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" className="text-purple-600">
              View Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{event.title}</h4>
                    <p className="text-sm text-slate-600">{event.type} • {event.venue}</p>
                    <p className="text-xs text-slate-500">{event.date} at {event.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{event.revenue}</div>
                    <div className="text-xs text-slate-600 mb-1">
                      {event.ticketsSold}/{event.capacity} sold
                    </div>
                    <Badge 
                      className={`text-xs ${
                        event.status === 'selling' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : event.status === 'limited'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {event.status === 'selling' ? 'Selling Fast' : 
                       event.status === 'limited' ? 'Limited Seats' : 'On Sale'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Ticket Sales */}
      <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Ticket Sales</CardTitle>
            <Button variant="ghost" size="sm" className="text-purple-600">
              View All Sales
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{booking.event}</h4>
                    <p className="text-sm text-slate-600">{booking.customer} • {booking.tickets} ticket{booking.tickets > 1 ? 's' : ''}</p>
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
                          : booking.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {booking.status}
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

      {/* Event Creation Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Create New Event</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEventForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter event title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Event Type</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Concert</option>
                      <option>Conference</option>
                      <option>Workshop</option>
                      <option>Food & Drink</option>
                      <option>Photography</option>
                      <option>Networking</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Venue</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Event venue"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Capacity</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Max attendees"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ticket Price</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Price per ticket"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe your event"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowEventForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log('Create event');
                    setShowEventForm(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Create Event
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
