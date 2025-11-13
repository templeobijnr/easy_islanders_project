import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PremiumKPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: {
    direction: 'up' | 'down';
    percentage: number;
  };
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red';
}

const colorClasses = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-100',
    border: 'border-green-200',
    icon: 'bg-green-100 text-green-600',
    trend: 'text-green-600',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    border: 'border-purple-200',
    icon: 'bg-purple-100 text-purple-600',
    trend: 'text-purple-600',
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-100',
    border: 'border-amber-200',
    icon: 'bg-amber-100 text-amber-600',
    trend: 'text-amber-600',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-100',
    border: 'border-red-200',
    icon: 'bg-red-100 text-red-600',
    trend: 'text-red-600',
  },
};

export const PremiumKPICard: React.FC<PremiumKPICardProps> = ({
  title,
  value,
  icon,
  trend,
  color,
}) => {
  const colors = colorClasses[color];
  const TrendIcon = trend.direction === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className={`border ${colors.border} ${colors.bg} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mb-4">{value}</p>
            <div className={`flex items-center gap-1 ${colors.trend}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">{trend.percentage}%</span>
              <span className="text-xs text-slate-600 ml-1">vs last month</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${colors.icon}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
