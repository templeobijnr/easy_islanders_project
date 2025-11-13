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
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(to)}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      {stats && stats.length > 0 && (
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
