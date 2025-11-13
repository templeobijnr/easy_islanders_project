import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PortfolioSummaryCard from './components/PortfolioSummaryCard';
import UnitMixChart from './components/UnitMixChart';
import PortfolioTable from './components/PortfolioTable';
import UnderperformingAssetsList from './components/UnderperformingAssetsList';

const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Management</h1>
        <p className="text-muted-foreground mt-2">
          Complete view of your property inventory and performance
        </p>
      </div>

      {/* Top Row - Summary and Unit Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioSummaryCard />
        <UnitMixChart />
      </div>

      {/* Portfolio Table */}
      <PortfolioTable />

      {/* Underperforming Assets */}
      <UnderperformingAssetsList />
    </div>
  );
};

export default PortfolioPage;
