import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PipelineFunnelChart from './components/PipelineFunnelChart';
import PipelineStageLists from './components/PipelineStageLists';
import AgentPerformanceCard from './components/AgentPerformanceCard';
import StalledDealsCard from './components/StalledDealsCard';

const SalesPipelinePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/home/real-estate')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Overview
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
        <p className="text-muted-foreground mt-2">
          Manage leads, viewings, and deal progression
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineFunnelChart />
        <AgentPerformanceCard />
      </div>

      <PipelineStageLists />
      <StalledDealsCard />
    </div>
  );
};

export default SalesPipelinePage;
