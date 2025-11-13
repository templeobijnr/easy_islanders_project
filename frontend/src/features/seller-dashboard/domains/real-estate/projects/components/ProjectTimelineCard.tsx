import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle, Clock } from 'lucide-react';

const ProjectTimelineCard: React.FC = () => {
  const milestones = [
    { name: 'Foundation Complete', status: 'done', date: '2025-06-15' },
    { name: 'Structure Complete', status: 'done', date: '2025-09-20' },
    { name: 'MEP Installation', status: 'in_progress', date: '2025-11-30' },
    { name: 'Interior Finishing', status: 'upcoming', date: '2026-02-15' },
    { name: 'Handover', status: 'upcoming', date: '2026-04-30' },
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'done') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (status === 'in_progress') {
      return <Clock className="h-5 w-5 text-blue-600" />;
    }
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>Key milestones for Kyrenia Marina Towers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="pt-0.5">{getStatusIcon(milestone.status)}</div>
              <div className="flex-1">
                <p className="font-semibold">{milestone.name}</p>
                <p className="text-sm text-muted-foreground">{milestone.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTimelineCard;
