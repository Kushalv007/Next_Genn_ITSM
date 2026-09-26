import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { RequestStatusBadge } from '@/components/ui/StatusBadge';
import { getRequests } from '@/api/catalog';
import type { ServiceRequest } from '@/types';
import { toast } from 'sonner';

export function RequestList(): JSX.Element {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getRequests({
        status: statusFilter,
        search: searchTerm,
      });
      setRequests(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load service requests';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRequests();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchRequests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Service Requests
          </h1>
          <p className="text-sm text-slate-500">
            Track fulfillment of hardware, software, and access requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchRequests()}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/service-catalog')}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Catalog
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search request #, service item, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white"
              />
            </div>
            <select
              aria-label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={FileText}
              title="No service requests found"
              description="You have not submitted any service requests yet or none match your filters."
              action={{
                label: 'Browse Service Catalog',
                onClick: () => navigate('/service-catalog'),
              }}
            />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-32 font-semibold text-slate-700">Request #</TableHead>
                <TableHead className="font-semibold text-slate-700">Service Item</TableHead>
                <TableHead className="font-semibold text-slate-700">Description</TableHead>
                <TableHead className="w-32 font-semibold text-slate-700">Status</TableHead>
                <TableHead className="w-40 font-semibold text-slate-700">Requester</TableHead>
                <TableHead className="w-40 font-semibold text-slate-700">Assigned To</TableHead>
                <TableHead className="w-32 font-semibold text-slate-700">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow
                  key={req.id}
                  onClick={() => navigate(`/requests/${req.id}`)}
                  className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                >
                  <TableCell className="font-mono text-sm font-bold text-blue-600">
                    {req.requestNumber}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-900">
                      {req.catalogItem?.name}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {req.catalogItem?.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600 line-clamp-1">
                      {req.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <RequestStatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {req.requester ? `${req.requester.firstName} ${req.requester.lastName}` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {req.assignedTo ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        {`${req.assignedTo.firstName} ${req.assignedTo.lastName}`}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(req.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
