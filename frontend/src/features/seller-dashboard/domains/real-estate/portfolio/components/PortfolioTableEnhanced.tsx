/**
 * Enhanced Portfolio Table with Bulk Actions
 * - Select multiple properties
 * - Bulk delete, bulk export (CSV)
 * - Performance alerts for underperforming properties
 */
import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Eye, Trash2, ArrowUpDown, Download, AlertTriangle } from 'lucide-react';

type Property = {
  id: string;
  listing_id?: string | null;
  title: string;
  property_type: string;
  city: string;
  status: 'vacant' | 'occupied' | 'maintenance' | string;
  purpose: string;
  nightly_price?: number | null;
  monthly_price?: number | null;
  occupancy_last_30d?: number;
};

type Actions = {
  onEdit?: (property: Property) => void;
  onView?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onBulkDelete?: (propertyIds: string[]) => void;
};

interface PortfolioTableEnhancedProps {
  properties: Property[];
  underperforming: Property[];
  onEdit?: (property: Property) => void;
  onView?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onBulkDelete?: (propertyIds: string[]) => void;
}

export default function PortfolioTableEnhanced({
  properties,
  underperforming,
  onEdit,
  onView,
  onDelete,
  onBulkDelete,
}: PortfolioTableEnhancedProps) {
  const [sortKey, setSortKey] = useState<'title' | 'city' | 'occupancy_last_30d'>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const items = [...(properties || [])];
    items.sort((a: any, b: any) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [properties, sortKey, sortDir]);

  const uSet = new Set((underperforming || []).map((u) => u.id));

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      occupied: 'bg-green-100 text-green-800',
      vacant: 'bg-amber-100 text-amber-800',
      maintenance: 'bg-blue-100 text-blue-800',
    };
    const cls = map[s] || 'bg-slate-100 text-slate-800';
    return <Badge className={cls}>{s}</Badge>;
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedIds.size} selected properties? This action cannot be undone.`
    );
    if (confirmed && onBulkDelete) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleExportCSV = () => {
    if (sorted.length === 0) return;

    const headers = ['Title', 'Type', 'City', 'Status', 'Purpose', 'Nightly Price', 'Monthly Price', 'Occupancy %'];
    const rows = sorted.map((p) => [
      p.title,
      p.property_type,
      p.city,
      p.status,
      p.purpose,
      p.nightly_price || '',
      p.monthly_price || '',
      p.occupancy_last_30d || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `portfolio-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.size} {selectedIds.size === 1 ? 'property' : 'properties'} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Export All Button */}
      {selectedIds.size === 0 && sorted.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export All to CSV
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={sorted.length > 0 && selectedIds.size === sorted.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="min-w-[220px]">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('title')}>
                  Title <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="min-w-[140px]">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('city')}>
                  City <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-[140px]">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('occupancy_last_30d')}>
                  Occupancy % <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  No properties found
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((p) => {
                const isUnderperforming = uSet.has(p.id);
                return (
                  <TableRow key={p.id} className={isUnderperforming ? 'bg-amber-50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(p.id)}
                        onCheckedChange={() => toggleSelect(p.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {isUnderperforming && (
                          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-1" />
                        )}
                        <div>
                          <div className="font-semibold">{p.title}</div>
                          <div className="text-xs text-slate-500">
                            {p.purpose === 'rent' ? 'For Rent' : 'For Sale'}
                          </div>
                          {isUnderperforming && (
                            <div className="text-xs text-amber-600 mt-1">
                              Low occupancy - consider adjusting price
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{p.property_type || '—'}</TableCell>
                    <TableCell>{p.city || '—'}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>
                      {typeof p.occupancy_last_30d === 'number' ? (
                        <span
                          className={
                            p.occupancy_last_30d < 40
                              ? 'text-amber-600 font-semibold'
                              : p.occupancy_last_30d > 80
                              ? 'text-green-600 font-semibold'
                              : ''
                          }
                        >
                          {p.occupancy_last_30d}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="ghost" title="Edit" onClick={() => onEdit?.(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" title="View" onClick={() => onView?.(p)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Delete" onClick={() => onDelete?.(p)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
