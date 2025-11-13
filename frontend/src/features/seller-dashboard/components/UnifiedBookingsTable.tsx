/**
 * Unified Bookings Table - Multi-Domain Bookings with Sorting, Filtering, and Actions
 */

import React, { useState, useMemo } from 'react';
import { useUnifiedBookings } from '../hooks/useDomainMetrics';
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
  Mail,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type SortField = 'title' | 'customer' | 'status' | 'total_price' | 'created_at' | 'domain';
type SortOrder = 'asc' | 'desc';

interface BookingFilters {
  search: string;
  status: string;
  domain: string;
}

interface UnifiedBookingsTableProps {
  domain?: string;
}

export const UnifiedBookingsTable: React.FC<UnifiedBookingsTableProps> = ({ domain }) => {
  const { data: bookings, isLoading, error } = useUnifiedBookings();
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<BookingFilters>({
    search: '',
    status: 'all',
    domain: 'all',
  });

  // Filter and sort bookings
  const processedBookings = useMemo(() => {
    if (!bookings) return [];

    let filtered = bookings.filter((booking: any) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !booking.title.toLowerCase().includes(searchLower) &&
          !booking.customer.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && booking.status !== filters.status) {
        return false;
      }

      // Domain filter
      if (filters.domain !== 'all' && booking.domain !== filters.domain) {
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
      if (sortField === 'total_price') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [bookings, filters, sortField, sortOrder]);

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
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Failed to load bookings. Please try again.</p>
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
              placeholder="Search by booking or customer..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <SortHeader field="title" label="Listing" />
              <SortHeader field="customer" label="Customer" />
              <SortHeader field="domain" label="Domain" />
              <SortHeader field="status" label="Status" />
              <SortHeader field="total_price" label="Amount" />
              <TableHead>Dates</TableHead>
              <SortHeader field="created_at" label="Booked" />
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
                    <Skeleton className="h-4 w-32" />
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
            ) : processedBookings.length > 0 ? (
              processedBookings.map((booking: any) => (
                <TableRow key={booking.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="max-w-xs truncate">{booking.title}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {booking.customer}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDomainBadgeColor(
                        booking.domain
                      )}`}
                    >
                      {booking.domain}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(booking.status)}
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${booking.total_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {booking.check_in && booking.check_out ? (
                      <div>
                        <div>{new Date(booking.check_in).toLocaleDateString()}</div>
                        <div className="text-xs">to {new Date(booking.check_out).toLocaleDateString()}</div>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {new Date(booking.created_at).toLocaleDateString()}
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
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Send Message
                        </DropdownMenuItem>
                        {booking.status === 'pending' && (
                          <>
                            <DropdownMenuItem className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                              <XCircle className="w-4 h-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No bookings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {processedBookings.length} of {bookings?.length || 0} bookings
      </div>
    </div>
  );
};
