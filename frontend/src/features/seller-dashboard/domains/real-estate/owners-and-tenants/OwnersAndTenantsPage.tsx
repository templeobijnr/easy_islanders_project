import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import OwnersDirectory from './components/OwnersDirectory';
import TenantsDirectory from './components/TenantsDirectory';
import LeaseExpiryCard from './components/LeaseExpiryCard';

const OwnersAndTenantsPage: React.FC = () => {
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
        <h1 className="text-3xl font-bold tracking-tight">Owners & Tenants</h1>
        <p className="text-muted-foreground mt-2">
          Manage relationships and lease tracking
        </p>
      </div>

      <OwnersDirectory />
      <TenantsDirectory />
      <LeaseExpiryCard />
    </div>
  );
};

export default OwnersAndTenantsPage;
