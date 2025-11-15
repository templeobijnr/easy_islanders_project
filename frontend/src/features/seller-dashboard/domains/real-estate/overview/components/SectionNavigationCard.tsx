/**
 * Navigation card for dashboard sections
 * Displays icon, title, description, and stats
 * Navigates to section on click
 */
import { Link } from 'react-router-dom';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface SectionNavigationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  stats?: Array<{
    label: string;
    value: string | number;
  }>;
}

export const SectionNavigationCard = ({
  icon: Icon,
  title,
  description,
  to,
  stats,
}: SectionNavigationCardProps) => {
  return (
    <Link to={to} className="block group h-full">
      <Card className="cursor-pointer rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-slate-200 bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200 shadow-lg group h-44 flex flex-col relative overflow-hidden">
        {/* Decorative circle like in sidebar */}
        <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40" />
        
        <CardHeader className="pb-4 flex-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-lime-600 text-white shadow-inner">
              <Icon size={20} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-slate-900">
                {title}
              </CardTitle>
              <CardDescription className="mt-1.5 text-sm leading-relaxed text-slate-700">
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {stats && stats.length > 0 && (
          <CardContent className="pt-0 mt-auto relative z-10">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/60 backdrop-blur border border-white/40">
              {stats.map((stat, index) => (
                <div key={index} className="flex flex-col">
                  <span className="text-2xl font-bold font-display text-slate-900">
                    {stat.value}
                  </span>
                  <span className="text-xs text-slate-700 font-medium mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
};
