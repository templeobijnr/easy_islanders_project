import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

/**
 * Events Domain Home
 * TODO: Implement domain-specific cards for event management
 */
export const DomainHomeEvents: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Events Overview</h1>
          <p className="text-slate-600">Manage your events and ticket sales</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">12</div>
            <p className="text-sm text-slate-600 mt-2">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">1,847</div>
            <p className="text-sm text-green-600 mt-2">↑ 23% vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">€28,450</div>
            <p className="text-sm text-slate-600 mt-2">This month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
