import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PremiumMetricsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend: {
    direction: 'up' | 'down';
    percentage: number;
  };
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red';
}

const colorClasses = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    trend: 'text-blue-600 bg-blue-100',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    light: 'bg-green-50',
    text: 'text-green-600',
    trend: 'text-green-600 bg-green-100',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    light: 'bg-purple-50',
    text: 'text-purple-600',
    trend: 'text-purple-600 bg-purple-100',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-500 to-yellow-600',
    light: 'bg-amber-50',
    text: 'text-amber-600',
    trend: 'text-amber-600 bg-amber-100',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500 to-rose-600',
    light: 'bg-red-50',
    text: 'text-red-600',
    trend: 'text-red-600 bg-red-100',
  },
};

export const PremiumMetricsCard: React.FC<PremiumMetricsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color,
}) => {
  const colors = colorClasses[color];
  const TrendIcon = trend.direction === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className={`h-1 ${colors.bg}`} />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${colors.trend}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-xs font-semibold">{trend.percentage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
