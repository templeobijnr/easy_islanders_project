import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import RevenueSummaryCard from './components/RevenueSummaryCard';
import RevenueByPropertyTable from './components/RevenueByPropertyTable';
import PayoutsStatusCard from './components/PayoutsStatusCard';
import ExpenseSnapshotCard from './components/ExpenseSnapshotCard';
import TopPerformersCard from './components/TopPerformersCard';

const EarningsPage: React.FC = () => {
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
        <h1 className="text-3xl font-bold tracking-tight">Earnings & Finance</h1>
        <p className="text-muted-foreground mt-2">
          Revenue, payouts, and financial performance across all properties
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueSummaryCard />
        <PayoutsStatusCard />
      </div>

      <RevenueByPropertyTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseSnapshotCard />
        <TopPerformersCard />
      </div>
    </div>
  );
};

export default EarningsPage;
