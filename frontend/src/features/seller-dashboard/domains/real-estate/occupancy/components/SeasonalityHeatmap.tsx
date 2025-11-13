import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const SeasonalityHeatmap: React.FC = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Simulated occupancy data (0-100)
  const data = months.map((month, mIdx) =>
    weekdays.map((day, dIdx) => {
      // Higher occupancy in summer and weekends
      const summerBoost = mIdx >= 5 && mIdx <= 8 ? 20 : 0;
      const weekendBoost = dIdx >= 5 ? 15 : 0;
      return Math.min(100, 50 + summerBoost + weekendBoost + Math.random() * 20);
    })
  );

  const getColor = (value: number) => {
    if (value >= 90) return 'bg-green-600';
    if (value >= 75) return 'bg-green-400';
    if (value >= 60) return 'bg-yellow-400';
    if (value >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seasonality Heatmap</CardTitle>
        <CardDescription>Occupancy patterns by month and day of week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Weekday headers */}
            <div className="flex gap-1 mb-1 ml-12">
              {weekdays.map((day) => (
                <div key={day} className="w-12 text-center text-xs text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {months.map((month, mIdx) => (
              <div key={month} className="flex gap-1 mb-1">
                <div className="w-12 text-xs text-muted-foreground flex items-center">
                  {month}
                </div>
                {weekdays.map((day, dIdx) => {
                  const value = data[mIdx][dIdx];
                  return (
                    <div
                      key={`${month}-${day}`}
                      className={`w-12 h-8 rounded ${getColor(value)} flex items-center justify-center text-xs font-semibold text-white cursor-pointer hover:opacity-80 transition-opacity`}
                      title={`${month} ${day}: ${Math.round(value)}%`}
                    >
                      {Math.round(value)}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4">
              <span className="text-xs text-muted-foreground">Low</span>
              <div className="flex gap-1">
                <div className="w-6 h-4 bg-red-400 rounded" />
                <div className="w-6 h-4 bg-orange-400 rounded" />
                <div className="w-6 h-4 bg-yellow-400 rounded" />
                <div className="w-6 h-4 bg-green-400 rounded" />
                <div className="w-6 h-4 bg-green-600 rounded" />
              </div>
              <span className="text-xs text-muted-foreground">High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonalityHeatmap;
