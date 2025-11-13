import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

interface SectionNavigationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stats?: { label: string; value: string | number }[];
  path: string;
  iconColor?: string;
}

export const SectionNavigationCard: React.FC<SectionNavigationCardProps> = ({
  title,
  description,
  icon: Icon,
  stats = [],
  path,
  iconColor = 'text-primary',
}) => {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50"
      onClick={() => navigate(path)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg bg-primary/10 ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {stats.length > 0 && (
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SectionNavigationCard;
