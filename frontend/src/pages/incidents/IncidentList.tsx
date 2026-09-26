import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
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
import { IncidentStatusBadge, IncidentPriorityBadge } from '@/components/ui/StatusBadge';
import { getIncidents } from '@/api/incidents';
import type { Incident } from '@/types';
import { toast } from 'sonner';

export function IncidentList(): JSX.Element {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const fetchIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getIncidents({
        status: statusFilter,
        priority: priorityFilter,
        search: searchTerm,
      });
      setIncidents(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load incidents';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchIncidents();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchIncidents]);

  const totalCount = incidents.length;
  const newCount = incidents.filter((i) => i.status === 'NEW').length;
  const progressCount = incidents.filter((i) => i.status === 'IN_PROGRESS').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Incident Management
          </h1>
          <p className="text-sm text-slate-500">
            Track, triage, and resolve IT service disruptions and system failures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchIncidents()}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/incidents/new')}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Report Incident
          </Button>
        </div>
      </div>

      {/* Quick Status Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-slate-900">{isLoading ? '-' : totalCount}</p>
            </div>
            <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
              <Inbox className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">New</p>
              <p className="text-2xl font-bold text-amber-700">{isLoading ? '-' : newCount}</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-bold text-blue-700">{isLoading ? '-' : progressCount}</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Resolved</p>
              <p className="text-2xl font-bold text-emerald-700">{isLoading ? '-' : resolvedCount}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search ticket #, description, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING">Pending</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              <select
                aria-label="Filter by Priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={AlertTriangle}
              title="No incidents found"
              description="No incidents match the active search or filter criteria. Report an incident to get started."
              action={{
                label: 'Report Incident',
                onClick: () => navigate('/incidents/new'),
              }}
            />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-32 font-semibold text-slate-700">Ticket #</TableHead>
                <TableHead className="font-semibold text-slate-700">Short Description</TableHead>
                <TableHead className="w-28 font-semibold text-slate-700">Priority</TableHead>
                <TableHead className="w-32 font-semibold text-slate-700">Status</TableHead>
                <TableHead className="w-40 font-semibold text-slate-700">Requester</TableHead>
                <TableHead className="w-40 font-semibold text-slate-700">Assigned To</TableHead>
                <TableHead className="w-32 font-semibold text-slate-700">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow
                  key={incident.id}
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                  className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                >
                  <TableCell className="font-mono text-sm font-bold text-blue-600">
                    {incident.ticketNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 line-clamp-1">
                        {incident.shortDescription}
                      </span>
                      <span className="text-xs text-slate-500">{incident.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <IncidentPriorityBadge priority={incident.priority} />
                  </TableCell>
                  <TableCell>
                    <IncidentStatusBadge status={incident.status} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {incident.requester ? `${incident.requester.firstName} ${incident.requester.lastName}` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {incident.assignedTo ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        {`${incident.assignedTo.firstName} ${incident.assignedTo.lastName}`}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(incident.createdAt).toLocaleDateString(undefined, {
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
