import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, Home, Castle, Warehouse } from 'lucide-react';

const PortfolioSummaryCard: React.FC = () => {
  const summary = {
    totalUnits: 24,
    byType: [
      { type: 'Apartments', count: 12, icon: Building2 },
      { type: 'Villas', count: 6, icon: Castle },
      { type: 'Houses', count: 4, icon: Home },
      { type: 'Commercial', count: 2, icon: Warehouse },
    ],
    byPurpose: {
      shortTerm: { count: 10, percentage: 42 },
      longTerm: { count: 12, percentage: 50 },
      forSale: { count: 2, percentage: 8 },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Units */}
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <p className="text-4xl font-bold text-primary">{summary.totalUnits}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Units</p>
        </div>

        {/* By Type */}
        <div>
          <h4 className="font-semibold mb-3">By Property Type</h4>
          <div className="grid grid-cols-2 gap-3">
            {summary.byType.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.type} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Purpose */}
        <div>
          <h4 className="font-semibold mb-3">By Purpose</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Short-term Rental</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${summary.byPurpose.shortTerm.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {summary.byPurpose.shortTerm.count}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Long-term Rental</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${summary.byPurpose.longTerm.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {summary.byPurpose.longTerm.count}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">For Sale</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${summary.byPurpose.forSale.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {summary.byPurpose.forSale.count}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSummaryCard;
