/**
 * KPI Card Component - Displays key performance indicators
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  } | number | null;
  description?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  icon,
  trend,
  description,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {typeof trend === 'object' ? (
                trend.direction === 'up' ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">+{trend.percentage}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">-{trend.percentage}%</span>
                  </>
                )
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">+{trend}%</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
