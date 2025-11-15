/**
 * BulkActionsBar Component
 *
 * Appears when listings are selected, showing count and available bulk actions
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onChangeStatus?: () => void;
  onUpdatePrice?: () => void;
  onSetAvailability?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onChangeStatus,
  onUpdatePrice,
  onSetAvailability,
  onDelete,
  className = "",
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={`bg-lime-50 border border-lime-200 rounded-xl p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-900">
            {selectedCount} {selectedCount === 1 ? 'listing' : 'listings'} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 px-2 text-slate-600 hover:text-slate-900"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {onChangeStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeStatus}
              className="h-8"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Change Status
            </Button>
          )}

          {onUpdatePrice && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdatePrice}
              className="h-8"
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Update Price
            </Button>
          )}

          {onSetAvailability && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetAvailability}
              className="h-8"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Set Availability
            </Button>
          )}

          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
