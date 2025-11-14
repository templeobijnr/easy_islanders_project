import React, { useMemo, useState } from 'react';
import { useRealEstatePortfolio } from '../hooks/useRealEstateDashboard';
import PortfolioSummary from './components/PortfolioSummary';
import PortfolioTableEnhanced from './components/PortfolioTableEnhanced';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import RealEstatePropertyUploadEnhanced from '../overview/RealEstatePropertyUploadEnhanced';
import axios from 'axios';
import config from '@/config';
import { useQueryClient } from '@tanstack/react-query';

export const PortfolioPage = () => {
  const { data: portfolio, isLoading, error } = useRealEstatePortfolio();
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [openUpload, setOpenUpload] = useState(false);
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  const handleAddProperty = () => {
    if (!isAuthenticated) return openAuthModal('login');
    if (!user || user.user_type !== 'business') return openAuthModal('register');
    setOpenUpload(true);
  };

  const filtered = useMemo(() => {
    const items = portfolio?.items || [];
    return items.filter((it: any) => {
      const byStatus = statusFilter === 'all' || it.status === statusFilter;
      const byType = typeFilter === 'all' || it.property_type === typeFilter;
      const byQuery = !query || (it.title || '').toLowerCase().includes(query.toLowerCase());
      return byStatus && byType && byQuery;
    });
  }, [portfolio, statusFilter, typeFilter, query]);

  if (isLoading) return <div className="p-6">Loading portfolio...</div>;
  if (error) return <div className="p-6 text-red-600">Error loading portfolio</div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Property Portfolio</h1>
        <Button onClick={handleAddProperty}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      <PortfolioSummary summary={portfolio?.summary} mix={portfolio?.mix} />

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-60"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="vacant">Vacant</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Array.from(new Set((portfolio?.items || []).map((i: any) => i.property_type))).map((t: any) => (
              <SelectItem key={t || 'unknown'} value={t || 'unknown'}>{t || 'Unknown'}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        <PortfolioTableEnhanced
          properties={filtered}
          underperforming={portfolio?.underperforming || []}
          onEdit={(p) => {
            // TODO: open uploader in edit mode with existing values
            console.info('Edit not yet implemented. Selected:', p.id);
          }}
          onView={(p) => {
            // For now, no-op or navigate to a details page if available
            console.info('View property clicked:', p.id);
          }}
          onDelete={async (p) => {
            if (!p.listing_id) {
              alert('Delete unavailable: missing listing id');
              return;
            }
            const ok = window.confirm('Delete this property? This cannot be undone.');
            if (!ok) return;
            try {
              const token = localStorage.getItem('token');
              await axios.delete(`${config.API_BASE_URL}/api/listings/${p.listing_id}/`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              });
              // Refresh portfolio and overview
              qc.invalidateQueries({ queryKey: ['real-estate', 'portfolio'] });
              qc.invalidateQueries({ queryKey: ['real-estate', 'overview'] });
            } catch (err) {
              console.error('Delete failed', err);
              alert('Failed to delete property.');
            }
          }}
          onBulkDelete={async (propertyIds) => {
            try {
              const token = localStorage.getItem('token');
              // Get listing_ids for the selected properties
              const propsToDelete = (portfolio?.items || []).filter((p: any) =>
                propertyIds.includes(p.id) && p.listing_id
              );

              // Delete each one
              for (const prop of propsToDelete) {
                await axios.delete(`${config.API_BASE_URL}/api/listings/${prop.listing_id}/`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
              }

              // Refresh data
              qc.invalidateQueries({ queryKey: ['real-estate', 'portfolio'] });
              qc.invalidateQueries({ queryKey: ['real-estate', 'overview'] });
              alert(`Successfully deleted ${propsToDelete.length} properties`);
            } catch (err) {
              console.error('Bulk delete failed', err);
              alert('Failed to delete some properties.');
            }
          }}
        />
      </div>

      <RealEstatePropertyUploadEnhanced
        open={openUpload}
        onOpenChange={setOpenUpload}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['real-estate', 'portfolio'] });
          qc.invalidateQueries({ queryKey: ['real-estate', 'overview'] });
        }}
      />
    </div>
  );
};
