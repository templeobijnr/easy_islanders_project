import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Lightbulb } from 'lucide-react';

const UnderperformingAssetsList: React.FC = () => {
  const underperformingAssets = [
    {
      id: 1,
      name: 'Sea Breeze Villa',
      code: 'FAM-V05',
      issue: 'Low Occupancy',
      occupancy: 35,
      avgEnquiries: 2,
      suggestion: 'Reduce nightly rate by 12% and add last-minute discount',
      severity: 'high',
    },
    {
      id: 2,
      name: 'Downtown Loft 3C',
      code: 'NIC-L3C',
      issue: 'Low Enquiries',
      occupancy: 52,
      avgEnquiries: 1,
      suggestion: 'Update photos and improve description with local attractions',
      severity: 'medium',
    },
    {
      id: 3,
      name: 'Mountain View House',
      code: 'TRO-H11',
      issue: 'Below Market Rate',
      occupancy: 68,
      avgEnquiries: 5,
      suggestion: 'Occupancy is good but rate is 18% below comparable properties',
      severity: 'low',
    },
  ];

  const getSeverityBadge = (severity: string) => {
    const config = {
      high: { variant: 'destructive' as const, label: 'High Priority' },
      medium: { variant: 'default' as const, label: 'Medium' },
      low: { variant: 'secondary' as const, label: 'Low' },
    };
    return <Badge variant={config[severity as keyof typeof config].variant}>{config[severity as keyof typeof config].label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>Underperforming Assets</CardTitle>
        </div>
        <CardDescription>
          Properties requiring attention to improve performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {underperformingAssets.map((asset) => (
          <div
            key={asset.id}
            className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{asset.name}</p>
                <p className="text-xs text-muted-foreground">{asset.code}</p>
              </div>
              {getSeverityBadge(asset.severity)}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Issue</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  {asset.issue}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Occupancy</p>
                <p className="text-sm font-medium">{asset.occupancy}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Enquiries/mo</p>
                <p className="text-sm font-medium">{asset.avgEnquiries}</p>
              </div>
            </div>

            {/* AI Suggestion */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-900 mb-1">AI Recommendation</p>
                  <p className="text-xs text-blue-700">{asset.suggestion}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1">
                Apply Suggestion
              </Button>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </div>
        ))}

        {underperformingAssets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>All properties are performing well!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnderperformingAssetsList;
