import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  Search,
  Plus,
  ArrowRight,
  User as UserIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProblemStatusBadge } from '@/components/ui/StatusBadge';
import { getProblems } from '@/api/problems';
import { useAuthStore } from '@/store/auth';
import type { Problem } from '@/types';
import { toast } from 'sonner';

const STATUS_FILTERS = ['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];

export function ProblemList(): JSX.Element {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAgentOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Technician';

  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const fetchProblems = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getProblems({
        search: searchTerm,
        status: selectedStatus,
      });
      setProblems(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load problems';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchProblems();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProblems]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Problem Management</h1>
          <p className="text-sm text-slate-500">
            Identify recurring issues, investigate root causes, and provide workarounds to minimize service disruption.
          </p>
        </div>
        {isAgentOrAdmin ? (
          <Button
            onClick={() => navigate('/problems/new')}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Problem
          </Button>
        ) : null}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search problems by ID, title, root cause..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Problems List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((idx) => (
            <Skeleton key={idx} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : problems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-800">No problems found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            No known problem investigations match your current filter criteria.
          </p>
          {isAgentOrAdmin ? (
            <Button onClick={() => navigate('/problems/new')} size="sm" className="mt-4">
              Create New Problem
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((problem) => (
            <Card
              key={problem.id}
              onClick={() => navigate(`/problems/${problem.id}`)}
              className="cursor-pointer border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-md transition-all"
            >
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-blue-600">
                      {problem.problemNumber}
                    </span>
                    <ProblemStatusBadge status={problem.status} />
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 rounded px-2 py-0.5">
                      <LinkIcon className="h-3 w-3" />
                      {problem._count?.incidents ?? 0} linked incident(s)
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
                    {problem.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                <div className="flex sm:flex-col sm:items-end justify-between items-center shrink-0 text-xs text-slate-500 gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {problem.owner ? `${problem.owner.firstName} ${problem.owner.lastName}` : 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 font-medium">
                    <span>View Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
