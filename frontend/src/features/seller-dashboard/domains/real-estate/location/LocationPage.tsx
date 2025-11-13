import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MapOccupancyHeatmap from './components/MapOccupancyHeatmap';
import LocationPerformanceTable from './components/LocationPerformanceTable';
import LocationInsightsCard from './components/LocationInsightsCard';
import NewAreaOpportunitiesCard from './components/NewAreaOpportunitiesCard';

const LocationPage: React.FC = () => {
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
        <h1 className="text-3xl font-bold tracking-tight">Location Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Geographic performance and market insights across all regions
        </p>
      </div>

      <MapOccupancyHeatmap />
      <LocationPerformanceTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LocationInsightsCard />
        <NewAreaOpportunitiesCard />
      </div>
    </div>
  );
};

export default LocationPage;
