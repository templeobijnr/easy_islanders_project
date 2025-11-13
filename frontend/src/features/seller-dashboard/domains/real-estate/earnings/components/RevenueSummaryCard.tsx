import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';

const RevenueSummaryCard: React.FC = () => {
  const revenue = {
    mtd: { value: '€12,540', change: '+12%' },
    lastMonth: { value: '€11,200', change: '+8%' },
    ytd: { value: '€142,300', change: '+15%' },
    breakdown: [
      { source: 'Short-term Rentals', amount: '€98,500', percentage: 69 },
      { source: 'Long-term Rentals', amount: '€38,200', percentage: 27 },
      { source: 'Sales Commissions', amount: '€5,600', percentage: 4 },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          <CardTitle>Revenue Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">MTD</p>
            <p className="text-2xl font-bold">{revenue.mtd.value}</p>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              {revenue.mtd.change}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Month</p>
            <p className="text-2xl font-bold">{revenue.lastMonth.value}</p>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              {revenue.lastMonth.change}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">YTD</p>
            <p className="text-2xl font-bold">{revenue.ytd.value}</p>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              {revenue.ytd.change}
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-semibold text-sm">Revenue Breakdown (YTD)</h4>
          {revenue.breakdown.map((item) => (
            <div key={item.source} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item.source}</span>
                <span className="font-semibold">{item.amount}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueSummaryCard;
