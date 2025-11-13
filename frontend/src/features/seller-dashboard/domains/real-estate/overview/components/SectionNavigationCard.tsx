/**
 * Navigation card for dashboard sections
 * Displays icon, title, description, and stats
 * Navigates to section on click
 */
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-slate-200 hover:border-primary/30 bg-gradient-to-br from-white to-slate-50/50 group"
      onClick={() => navigate(to)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
            <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex-1 pt-1">
            <CardTitle className="text-xl font-['Space_Grotesk'] group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {stats && stats.length > 0 && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50/50 border border-slate-100">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col">
                <span className="text-2xl font-bold font-['Space_Grotesk'] bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground font-medium mt-0.5">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
