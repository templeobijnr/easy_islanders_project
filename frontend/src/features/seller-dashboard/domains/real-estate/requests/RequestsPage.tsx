import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import RequestsInbox from './components/RequestsInbox';
import RequestDetailsDrawer from './components/RequestDetailsDrawer';
import LeadQualificationCard from './components/LeadQualificationCard';
import SLAComplianceCard from './components/SLAComplianceCard';

const RequestsPage: React.FC = () => {
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
        <h1 className="text-3xl font-bold tracking-tight">Requests Management</h1>
        <p className="text-muted-foreground mt-2">
          Handle booking and viewing enquiries efficiently
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RequestsInbox />
        </div>
        <div className="space-y-6">
          <LeadQualificationCard />
          <SLAComplianceCard />
        </div>
      </div>

      <RequestDetailsDrawer />
    </div>
  );
};

export default RequestsPage;
