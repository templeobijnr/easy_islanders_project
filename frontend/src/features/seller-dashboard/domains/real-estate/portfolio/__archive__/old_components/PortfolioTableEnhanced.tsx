/**
 * Enhanced Portfolio Table with Visual Cards & Clear Relationships
 * Premium design with:
 * - Visual property cards with images (like "My Units")
 * - Clear categorization by listing type
 * - Management relationships (self-managed vs managed for others)
 * - Tenant connection status
 * - Intuitive filtering and actions
 */
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence as FMAnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pencil,
  Eye,
  Trash2,
  ArrowUpDown,
  Download,
  AlertTriangle,
  Home,
  Building2,
  Users,
  MapPin,
  Bed,
  Bath,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  LayoutList,
  Filter,
  User,
  UserCheck
} from 'lucide-react';

// Type-safe wrapper for AnimatePresence to align with framer-motion v11 typings
const AnimatePresence = FMAnimatePresence as any;

type Property = {
  id: string;
  listing_id?: string | null;
  title: string;
  property_type: string;
  city: string;
  area?: string;
  status: 'vacant' | 'occupied' | 'maintenance' | string;
  purpose: string;
  nightly_price?: number | null;
  monthly_price?: number | null;
  occupancy_last_30d?: number;
  image_url?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  managed_for_others?: boolean;
  owner_name?: string;
  tenant_name?: string;
  lease_end_date?: string;
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

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'rent' | 'sale' | 'managed_for_others';

export default function PortfolioTableEnhanced({
  properties,
  underperforming,
  onEdit,
  onView,
  onDelete,
  onBulkDelete,
}: PortfolioTableEnhancedProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
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

  // Filter properties based on selected filter
  const filtered = useMemo(() => {
    let items = [...(properties || [])];

    switch (filterType) {
      case 'rent':
        items = items.filter(p => p.purpose === 'rent');
        break;
      case 'sale':
        items = items.filter(p => p.purpose === 'sale');
        break;
      case 'managed_for_others':
        items = items.filter(p => p.managed_for_others === true);
        break;
      default:
        // 'all' - no filter
        break;
    }

    return items;
  }, [properties, filterType]);

  // Sort filtered properties
  const sorted = useMemo(() => {
    const items = [...filtered];
    items.sort((a: any, b: any) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [filtered, sortKey, sortDir]);

  const uSet = new Set((underperforming || []).map((u) => u.id));

  // Calculate stats for each category
  const stats = useMemo(() => {
    const all = properties.length;
    const rent = properties.filter(p => p.purpose === 'rent').length;
    const sale = properties.filter(p => p.purpose === 'sale').length;
    const managedForOthers = properties.filter(p => p.managed_for_others).length;

    return { all, rent, sale, managedForOthers };
  }, [properties]);

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
    <div className="space-y-6">
      {/* Header: Filters & View Mode */}
      <div className="flex items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-white shadow-lg'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All Units ({stats.all})
          </button>
          <button
            onClick={() => setFilterType('rent')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filterType === 'rent'
                ? 'bg-gradient-to-r from-sky-500 to-lime-500 text-white shadow-lg'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            For Rent ({stats.rent})
          </button>
          <button
            onClick={() => setFilterType('sale')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filterType === 'sale'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            For Sale ({stats.sale})
          </button>
          <button
            onClick={() => setFilterType('managed_for_others')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filterType === 'managed_for_others'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <UserCheck className="h-4 w-4 inline mr-1" />
            Managed for Others ({stats.managedForOthers})
          </button>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-lime-50 border-2 border-lime-200 rounded-xl">
              <span className="text-sm font-semibold text-lime-900">
                {selectedIds.size} selected
              </span>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {selectedIds.size === 0 && sorted.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}

          <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-lime-600 shadow-md'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-lime-600 shadow-md'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="text-center py-16 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300">
          <Home className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-neutral-700">No properties found</p>
          <p className="text-sm text-neutral-500 mt-2">
            {filterType !== 'all' ? 'Try changing your filter' : 'Add your first property to get started'}
          </p>
        </div>
      )}

      {/* Grid View - Property Cards (like "My Units") */}
      {viewMode === 'grid' && sorted.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {sorted.map((property) => {
              const isUnderperforming = uSet.has(property.id);
              const isSelected = selectedIds.has(property.id);

              return (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative rounded-2xl border-2 bg-white shadow-lg hover:shadow-xl transition-all overflow-hidden ${
                    isSelected ? 'border-lime-500 ring-4 ring-lime-100' : 'border-neutral-200'
                  } ${isUnderperforming ? 'bg-amber-50/30' : ''}`}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-4 left-4 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(property.id)}
                      className="bg-white/90 backdrop-blur-sm shadow-lg"
                    />
                  </div>

                  {/* Property Image */}
                  <div className="relative aspect-video overflow-hidden bg-neutral-200">
                    {property.image_url ? (
                      <img
                        src={property.image_url}
                        alt={property.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                        <Home className="h-16 w-16 text-neutral-400" />
                      </div>
                    )}

                    {/* Performance Alert Badge */}
                    {isUnderperforming && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Low Occupancy
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute bottom-4 right-4">
                      {statusBadge(property.status)}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="p-5">
                    {/* Title & Type */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold font-display text-neutral-900 text-lg line-clamp-1">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                          <span className="text-sm text-neutral-600">
                            {property.city}
                            {property.area && `, ${property.area}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Management Relationship Indicator */}
                    {property.managed_for_others && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                        <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-purple-900">Managed for Owner</p>
                          {property.owner_name && (
                            <p className="text-xs text-purple-700">{property.owner_name}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tenant Info */}
                    {property.status === 'occupied' && property.tenant_name && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <User className="h-3.5 w-3.5 text-emerald-600" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-emerald-900">Current Tenant</p>
                          <p className="text-xs text-emerald-700">{property.tenant_name}</p>
                          {property.lease_end_date && (
                            <p className="text-xs text-emerald-600">Lease ends: {property.lease_end_date}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Property Features */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-neutral-600">
                      {property.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{property.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>{property.bathrooms}</span>
                        </div>
                      )}
                      {property.sqft && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{property.sqft} sqft</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Occupancy */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                          ${property.nightly_price || property.monthly_price}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {property.nightly_price ? 'per night' : 'per month'}
                        </p>
                      </div>
                      {typeof property.occupancy_last_30d === 'number' && (
                        <div className="text-right">
                          <div className={`flex items-center gap-1 text-sm font-semibold ${
                            property.occupancy_last_30d < 40
                              ? 'text-amber-600'
                              : property.occupancy_last_30d > 80
                              ? 'text-emerald-600'
                              : 'text-neutral-700'
                          }`}>
                            {property.occupancy_last_30d < 40 ? (
                              <TrendingDown className="h-4 w-4" />
                            ) : property.occupancy_last_30d > 80 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : null}
                            <span>{property.occupancy_last_30d}%</span>
                          </div>
                          <p className="text-xs text-neutral-500">occupancy</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onView?.(property)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(property)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(property)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* List View - Enhanced Table */}
      {viewMode === 'list' && sorted.length > 0 && (
        <div className="w-full overflow-x-auto rounded-2xl border-2 border-neutral-200 shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={sorted.length > 0 && selectedIds.size === sorted.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="min-w-[240px]">
                  <button className="inline-flex items-center gap-1 font-semibold" onClick={() => toggleSort('title')}>
                    Property <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="min-w-[140px]">
                  <button className="inline-flex items-center gap-1 font-semibold" onClick={() => toggleSort('city')}>
                    Location <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[120px]">
                  <button className="inline-flex items-center gap-1 font-semibold" onClick={() => toggleSort('occupancy_last_30d')}>
                    Performance <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p) => {
                const isUnderperforming = uSet.has(p.id);
                const isSelected = selectedIds.has(p.id);

                return (
                  <TableRow
                    key={p.id}
                    className={`${isSelected ? 'bg-lime-50' : ''} ${isUnderperforming ? 'bg-amber-50/50' : ''}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(p.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        {isUnderperforming && (
                          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-1" />
                        )}
                        <div>
                          <div className="font-bold text-neutral-900">{p.title}</div>
                          <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                            {p.purpose === 'rent' ? 'For Rent' : 'For Sale'}
                          </div>
                          {p.managed_for_others && (
                            <div className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              Managed for {p.owner_name || 'Owner'}
                            </div>
                          )}
                          {p.status === 'occupied' && p.tenant_name && (
                            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Tenant: {p.tenant_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="capitalize text-sm font-medium text-neutral-700">
                        {p.property_type || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                        <span>{p.city || '—'}</span>
                      </div>
                      {p.area && (
                        <div className="text-xs text-neutral-500 mt-0.5">{p.area}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-neutral-600">
                        {p.bedrooms && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-3.5 w-3.5" />
                            {p.bedrooms}
                          </div>
                        )}
                        {p.bathrooms && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" />
                            {p.bathrooms}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>
                      {typeof p.occupancy_last_30d === 'number' ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              p.occupancy_last_30d < 40
                                ? 'text-amber-600'
                                : p.occupancy_last_30d > 80
                                ? 'text-emerald-600'
                                : 'text-neutral-700'
                            }`}
                          >
                            {p.occupancy_last_30d}%
                          </span>
                          {p.occupancy_last_30d < 40 ? (
                            <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
                          ) : p.occupancy_last_30d > 80 ? (
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" title="Edit" onClick={() => onEdit?.(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" title="View" onClick={() => onView?.(p)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Delete" onClick={() => onDelete?.(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
