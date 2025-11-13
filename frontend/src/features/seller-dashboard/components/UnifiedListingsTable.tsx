/**
 * Unified Listings Table - Multi-Domain Listings with Sorting, Filtering, and Actions
 */

import React, { useState, useMemo } from 'react';
import { useUnifiedListings } from '../hooks/useDomainMetrics';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../../../components/ui/dropdown-menu";
import { Input } from "../../../components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../../components/ui/select";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  MoreHorizontal,
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react';

type SortField = 'title' | 'price' | 'status' | 'created_at' | 'domain';
type SortOrder = 'asc' | 'desc';

interface ListingFilters {
  search: string;
  status: string;
  domain: string;
}

interface UnifiedListingsTableProps {
  domain?: string;
}

export const UnifiedListingsTable: React.FC<UnifiedListingsTableProps> = ({ domain }) => {
  const { data: listings, isLoading, error } = useUnifiedListings();
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<ListingFilters>({
    search: '',
    status: 'all',
    domain: 'all',
  });

  // Filter and sort listings
  const processedListings = useMemo(() => {
    if (!listings) return [];

    let filtered = listings.filter((listing: any) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !listing.title.toLowerCase().includes(searchLower) &&
          !listing.location.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && listing.status !== filters.status) {
        return false;
      }

      // Domain filter
      if (filters.domain !== 'all' && listing.domain !== filters.domain) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle date sorting
      if (sortField === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Handle price sorting
      if (sortField === 'price') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [listings, filters, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (
          sortOrder === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        )}
      </div>
    </TableHead>
  );

  const getDomainBadgeColor = (domain: string) => {
    const colors: Record<string, string> = {
      real_estate: 'bg-blue-100 text-blue-800',
      events: 'bg-pink-100 text-pink-800',
      activities: 'bg-amber-100 text-amber-800',
      appointments: 'bg-purple-100 text-purple-800',
    };
    return colors[domain] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      sold: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Failed to load listings. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title or location..."
              value={filters.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-10"
            />
          </div>
        </div>

        <Select value={filters.status} onValueChange={(value: string) =>
          setFilters({ ...filters, status: value })
        }>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.domain} onValueChange={(value: string) =>
          setFilters({ ...filters, domain: value })
        }>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            <SelectItem value="real_estate">Real Estate</SelectItem>
            <SelectItem value="events">Events</SelectItem>
            <SelectItem value="activities">Activities</SelectItem>
            <SelectItem value="appointments">Appointments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="title" label="Title" />
              <SortHeader field="domain" label="Domain" />
              <SortHeader field="status" label="Status" />
              <SortHeader field="price" label="Price" />
              <TableHead>Location</TableHead>
              <SortHeader field="created_at" label="Created" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : processedListings.length > 0 ? (
              processedListings.map((listing: any) => (
                <TableRow key={listing.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="max-w-xs truncate">{listing.title}</div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDomainBadgeColor(
                        listing.domain
                      )}`}
                    >
                      {listing.domain}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                        listing.status
                      )}`}
                    >
                      {listing.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {listing.currency} {listing.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {listing.location || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-red-600"
                          onClick={() => {
                            // Handle delete
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No listings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {processedListings.length} of {listings?.length || 0} listings
      </div>
    </div>
  );
};
