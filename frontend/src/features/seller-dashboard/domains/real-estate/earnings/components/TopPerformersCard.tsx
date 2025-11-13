import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

const TopPerformersCard: React.FC = () => {
  const topPerformers = [
    { rank: 1, name: 'Villa Sunset Dreams', yield: '18.2%', revenue: '€24,500' },
    { rank: 2, name: 'Sea View Apartment A12', yield: '16.8%', revenue: '€21,300' },
    { rank: 3, name: 'Penthouse Luxury', yield: '15.4%', revenue: '€19,800' },
    { rank: 4, name: 'Garden House', yield: '14.2%', revenue: '€17,600' },
    { rank: 5, name: 'Mountain View House', yield: '13.9%', revenue: '€16,900' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle>Top Performers</CardTitle>
        </div>
        <CardDescription>Best properties by yield</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topPerformers.map((property) => (
            <div
              key={property.rank}
              className={`p-3 border rounded-lg flex items-center gap-3 ${
                property.rank === 1 ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  property.rank === 1
                    ? 'bg-yellow-500 text-white'
                    : property.rank === 2
                    ? 'bg-gray-400 text-white'
                    : property.rank === 3
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {property.rank}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{property.name}</p>
                <p className="text-xs text-muted-foreground">Revenue: {property.revenue}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{property.yield}</p>
                <p className="text-xs text-muted-foreground">Yield</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopPerformersCard;
