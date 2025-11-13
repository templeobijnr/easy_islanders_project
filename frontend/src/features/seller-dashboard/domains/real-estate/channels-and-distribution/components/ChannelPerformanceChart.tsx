import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ChannelPerformanceChart: React.FC = () => {
  const channels = [
    { name: 'Easy Islanders Direct', bookings: 45, revenue: '€52,300', percentage: 45 },
    { name: 'Own Website', bookings: 28, revenue: '€35,800', percentage: 28 },
    { name: 'Partner Portal A', bookings: 18, revenue: '€21,400', percentage: 18 },
    { name: 'Offline/Referrals', bookings: 12, revenue: '€14,200', percentage: 9 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.map((channel) => (
          <div key={channel.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{channel.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">{channel.bookings} bookings</span>
                <span className="font-semibold">{channel.revenue}</span>
              </div>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${channel.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ChannelPerformanceChart;
