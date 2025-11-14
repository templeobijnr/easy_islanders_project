import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Eye, Trash2, ArrowUpDown } from 'lucide-react';

type Property = {
  id: string;
  // Generic listing UUID used for edit/delete actions
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
};

export default function PortfolioTable({ properties, underperforming, onEdit, onView, onDelete }: { properties: Property[]; underperforming: Property[] } & Actions) {
  const [sortKey, setSortKey] = useState<'title' | 'city' | 'occupancy_last_30d'>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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

  return (
    <div className="w-full overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                No properties found
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((p) => (
              <TableRow key={p.id} className={uSet.has(p.id) ? 'bg-amber-50' : ''}>
                <TableCell>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-xs text-slate-500">{p.purpose === 'rent' ? 'For Rent' : 'For Sale'}</div>
                </TableCell>
                <TableCell className="capitalize">{p.property_type || '—'}</TableCell>
                <TableCell>{p.city || '—'}</TableCell>
                <TableCell>{statusBadge(p.status)}</TableCell>
                <TableCell>{typeof p.occupancy_last_30d === 'number' ? `${p.occupancy_last_30d}%` : '—'}</TableCell>
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
