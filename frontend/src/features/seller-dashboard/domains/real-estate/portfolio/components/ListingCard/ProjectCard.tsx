/**
 * ProjectCard - Card for property development projects
 *
 * Displays metrics like units available, enquiries, brochure downloads
 */

import React from 'react';
import { Building2, Mail, Download, Edit, Trash2, Settings } from 'lucide-react';
import { ListingCard, ListingCardAction } from './ListingCard';

interface ProjectData {
  id: string;
  title: string;
  reference_code?: string;
  image_url?: string;
  base_price: number; // Starting from price
  currency: string;
  status: 'active' | 'sold-out';

  // Project metrics
  total_units: number;
  available_units: number;
  new_enquiries: number;
  viewing_requests: number;
  brochure_downloads: number;
}

interface ProjectCardProps {
  listing: ProjectData;
  onEnquiriesClick: () => void;
  onUnitsClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageUnits?: () => void;
  onDownloadBrochure?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  listing,
  onEnquiriesClick,
  onUnitsClick,
  onEdit,
  onDelete,
  onManageUnits,
  onDownloadBrochure,
}) => {
  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: listing.currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(listing.base_price);

  // Calculate units sold
  const unitsSold = listing.total_units - listing.available_units;
  const soldPercentage = (unitsSold / listing.total_units) * 100;

  // Status mapping
  const statusConfig = {
    active: { label: 'Active', variant: 'active' as const },
    'sold-out': { label: 'Sold Out', variant: 'success' as const },
  };

  // Metrics
  const metrics = [
    {
      icon: '🏢',
      label: `${listing.available_units}/${listing.total_units} units available`,
      onClick: onUnitsClick,
      highlight: listing.available_units > 0,
    },
    {
      icon: '📩',
      label: listing.new_enquiries > 0
        ? `${listing.new_enquiries} new enquir${listing.new_enquiries !== 1 ? 'ies' : 'y'}`
        : 'No new enquiries',
      onClick: onEnquiriesClick,
      highlight: listing.new_enquiries > 0,
    },
    {
      icon: '👁',
      label: listing.viewing_requests > 0
        ? `${listing.viewing_requests} viewing request${listing.viewing_requests !== 1 ? 's' : ''}`
        : 'No viewing requests',
    },
    {
      icon: '📥',
      label: `${listing.brochure_downloads} brochure downloads`,
    },
  ];

  // Add sales progress
  if (unitsSold > 0) {
    metrics.push({
      icon: '📊',
      label: `${soldPercentage.toFixed(1)}% sold (${unitsSold} units)`,
    });
  }

  // Primary actions
  const primaryActions: ListingCardAction[] = [
    {
      label: 'Units',
      icon: <Building2 className="h-4 w-4" />,
      onClick: onUnitsClick,
      variant: 'primary',
    },
    {
      label: 'Enquiries',
      icon: <Mail className="h-4 w-4" />,
      onClick: onEnquiriesClick,
    },
  ];

  // Menu actions
  const menuActions: ListingCardAction[] = [
    {
      label: 'Edit Project',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
    },
  ];

  if (onManageUnits) {
    menuActions.push({
      label: 'Manage Units',
      icon: <Settings className="h-4 w-4" />,
      onClick: onManageUnits,
    });
  }

  if (onDownloadBrochure) {
    menuActions.push({
      label: 'Download Brochure',
      icon: <Download className="h-4 w-4" />,
      onClick: onDownloadBrochure,
    });
  }

  menuActions.push({
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'danger',
  });

  return (
    <ListingCard
      imageUrl={listing.image_url}
      imageFallback="No Image"
      title={listing.title}
      subtitle={listing.reference_code}
      price={formattedPrice}
      priceLabel="starting from"
      status={statusConfig[listing.status]}
      metrics={metrics}
      primaryActions={primaryActions}
      menuActions={menuActions}
    >
      {/* Sales progress bar */}
      {listing.total_units > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
            <span>Sales Progress</span>
            <span>{soldPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${soldPercentage}%` }}
            />
          </div>
        </div>
      )}
    </ListingCard>
  );
};

/**
 * Example usage:
 *
 * <ProjectCard
 *   listing={{
 *     id: '999',
 *     title: 'Seaside Residences Development',
 *     reference_code: 'PROJ-001',
 *     base_price: 200000,
 *     currency: 'EUR',
 *     status: 'active',
 *     total_units: 50,
 *     available_units: 12,
 *     new_enquiries: 24,
 *     viewing_requests: 15,
 *     brochure_downloads: 156
 *   }}
 *   onEnquiriesClick={() => console.log('Open enquiries')}
 *   onUnitsClick={() => console.log('Open units')}
 *   onEdit={() => console.log('Edit project')}
 *   onDelete={() => console.log('Delete project')}
 * />
 */
