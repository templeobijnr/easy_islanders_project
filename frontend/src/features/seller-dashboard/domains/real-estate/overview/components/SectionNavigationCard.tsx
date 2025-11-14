/**
 * Navigation card for dashboard sections
 * Displays icon, title, description, and stats
 * Navigates to section on click
 */
import { Link } from 'react-router-dom';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card as HUCard, CardHeader as HUCardHeader, CardBody as HUCardBody } from '@heroui/react';
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
  useHeroUI?: boolean; // optional incremental migration
}

export const SectionNavigationCard = ({
  icon: Icon,
  title,
  description,
  to,
  stats,
  useHeroUI = false,
}: SectionNavigationCardProps) => {
  if (useHeroUI) {
    return (
      <Link to={to} className="block group h-full">
        <HUCard radius="lg" className="cursor-pointer rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group border border-slate-200 bg-white shadow-lg h-44 flex flex-col">
          <HUCardHeader className="pb-0 pt-4 px-5 flex-col items-start flex-1">
            <div className="flex items-center gap-3 w-full">
              <Icon size={20} className="text-slate-700" />
              <div className="flex-1">
                <div className="text-base font-semibold text-slate-700">
                  {title}
                </div>
                <div className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                  {description}
                </div>
              </div>
            </div>
          </HUCardHeader>
          {stats && stats.length > 0 && (
            <HUCardBody className="pt-2 px-5 pb-5 mt-auto">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                {stats.map((stat, index) => (
                  <div key={index} className="flex flex-col">
                    <span className="text-2xl font-bold font-display text-black">
                      {stat.value}
                    </span>
                    <span className="text-xs text-black font-medium mt-0.5">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </HUCardBody>
          )}
        </HUCard>
      </Link>
    );
  }

  return (
      <Link to={to} className="block group h-full">
      <Card className="cursor-pointer rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-slate-200 bg-white shadow-lg group h-44 flex flex-col">
        <CardHeader className="pb-4 flex-1">
          <div className="flex items-center gap-3">
            <Icon size={20} className="text-slate-700" />
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-slate-700">
                {title}
              </CardTitle>
              <CardDescription className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {stats && stats.length > 0 && (
          <CardContent className="pt-0 mt-auto">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {stats.map((stat, index) => (
                <div key={index} className="flex flex-col">
                  <span className="text-2xl font-bold font-display text-black">
                    {stat.value}
                  </span>
                  <span className="text-xs text-black font-medium mt-0.5">
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
