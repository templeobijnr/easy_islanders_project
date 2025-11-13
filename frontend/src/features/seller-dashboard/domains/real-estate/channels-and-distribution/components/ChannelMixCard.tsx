import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ChannelMixCard: React.FC = () => {
  const mixData = [
    { channel: 'Easy Islanders', color: 'bg-blue-500', percentage: 45 },
    { channel: 'Own Website', color: 'bg-green-500', percentage: 28 },
    { channel: 'Partner Portal', color: 'bg-yellow-500', percentage: 18 },
    { channel: 'Offline', color: 'bg-purple-500', percentage: 9 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution Mix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual bar */}
        <div className="flex h-8 rounded-lg overflow-hidden">
          {mixData.map((item) => (
            <div
              key={item.channel}
              className={`${item.color} flex items-center justify-center text-white text-xs font-semibold`}
              style={{ width: `${item.percentage}%` }}
            >
              {item.percentage}%
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3">
          {mixData.map((item) => (
            <div key={item.channel} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${item.color}`} />
              <span className="text-sm">{item.channel}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelMixCard;
