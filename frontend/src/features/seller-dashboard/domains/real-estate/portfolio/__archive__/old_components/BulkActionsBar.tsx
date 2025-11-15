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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            {selectedCount} {selectedCount === 1 ? 'listing' : 'listings'} selected
          </span>
          <span className="text-slate-400">·</span>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {onChangeStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeStatus}
              className="h-8"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Change status
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
              Adjust price
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
              Set availability
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

          {/* Clear Selection - lighter, at the end */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 ml-auto"
          >
            Clear selection
          </Button>
        </div>
      </div>
    </div>
  );
};
