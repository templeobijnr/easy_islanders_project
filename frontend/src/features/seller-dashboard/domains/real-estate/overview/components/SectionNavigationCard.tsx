/**
 * Navigation card for dashboard sections
 * Displays icon, title, description, and stats
 * Navigates to section on click
 */
import { Link } from 'react-router-dom';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, Plus } from 'lucide-react';

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
  // Check if this is the Portfolio card to apply special blue/teal theme
  const isPortfolio = title === 'Portfolio';
  
  return (
    <Link to={to} className="block group h-full">
      <Card className={`cursor-pointer rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-slate-200 shadow-lg group h-44 flex flex-col relative overflow-hidden ${
        isPortfolio 
          ? 'bg-gradient-to-r from-teal-400 to-blue-500' 
          : 'bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200'
      }`}>
        {/* Decorative circle like in sidebar */}
        <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40" />
        
        <CardHeader className="pb-4 flex-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shadow-inner ${
              isPortfolio 
                ? 'bg-white/20 text-white' 
                : 'bg-lime-600 text-white'
            }`}>
              <Icon size={20} />
            </div>
            <div className="flex-1">
              <CardTitle className={`text-base font-semibold ${
                isPortfolio ? 'text-white' : 'text-slate-900'
              }`}>
                {title}
              </CardTitle>
              <CardDescription className={`mt-1.5 text-sm leading-relaxed ${
                isPortfolio ? 'text-white/90' : 'text-slate-700'
              }`}>
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {stats && stats.length > 0 && (
          <CardContent className="pt-0 mt-auto relative z-10">
            <div className={`flex justify-between items-center p-4 rounded-xl backdrop-blur border ${
              isPortfolio 
                ? 'bg-white/20 border-white/30' 
                : 'bg-white/60 border-white/40'
            }`}>
              <div className="flex gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="flex flex-col">
                    <span className={`text-2xl font-bold font-display ${
                      isPortfolio ? 'text-white' : 'text-slate-900'
                    }`}>
                      {stat.value}
                    </span>
                    <span className={`text-xs font-medium mt-0.5 ${
                      isPortfolio ? 'text-white/80' : 'text-slate-700'
                    }`}>
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className={`px-3 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all ${
                  isPortfolio 
                    ? 'bg-white text-blue-700' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}>
                  View Portfolio
                </button>
                <button className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all ${
                  isPortfolio 
                    ? 'bg-white text-blue-700' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}>
                  <Plus size={14} />
                  Create
                </button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
};
