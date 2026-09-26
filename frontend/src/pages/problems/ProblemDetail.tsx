import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  User as UserIcon,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
  CheckCircle2,
  Lightbulb,
  FileQuestion,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProblemStatusBadge, IncidentStatusBadge, IncidentPriorityBadge } from '@/components/ui/StatusBadge';
import {
  getProblem,
  updateProblem,
  linkIncidentToProblem,
  unlinkIncidentFromProblem,
} from '@/api/problems';
import { getIncidents, getAgents } from '@/api/incidents';
import { useAuthStore } from '@/store/auth';
import type { Problem, ProblemStatus, User, Incident } from '@/types';
import { toast } from 'sonner';

export function ProblemDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAgentOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Technician';

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState<User[]>([]);

  // Triage state
  const [selectedStatus, setSelectedStatus] = useState<ProblemStatus>('OPEN');
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [rootCause, setRootCause] = useState('');
  const [workaround, setWorkaround] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Link incident state
  const [availableIncidents, setAvailableIncidents] = useState<Incident[]>([]);
  const [selectedIncidentToLink, setSelectedIncidentToLink] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const fetchProblemDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getProblem(id);
      setProblem(data);
      setSelectedStatus(data.status);
      setSelectedOwner(data.ownerId ?? '');
      setRootCause(data.rootCause ?? '');
      setWorkaround(data.workaround ?? '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load problem';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchProblemDetails();
  }, [fetchProblemDetails]);

  useEffect(() => {
    if (isAgentOrAdmin) {
      getAgents().then(setAgents).catch(() => {});
      getIncidents({ status: 'ALL' })
        .then((all) => {
          // Filter incidents not already linked to this problem
          setAvailableIncidents(all.filter((inc) => inc.problemId !== id));
        })
        .catch(() => {});
    }
  }, [isAgentOrAdmin, id]);

  const handleUpdate = async () => {
    if (!problem) return;
    try {
      setIsUpdating(true);
      const updated = await updateProblem(problem.id, {
        status: selectedStatus,
        ownerId: selectedOwner || null,
        rootCause,
        workaround,
      });
      setProblem(updated);
      toast.success('Problem details updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update problem';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLinkIncident = async () => {
    if (!problem || !selectedIncidentToLink) return;
    try {
      setIsLinking(true);
      await linkIncidentToProblem(problem.id, selectedIncidentToLink);
      toast.success('Incident linked to problem');
      setSelectedIncidentToLink('');
      await fetchProblemDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to link incident';
      toast.error(msg);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkIncident = async (incidentId: string) => {
    if (!problem) return;
    try {
      await unlinkIncidentFromProblem(problem.id, incidentId);
      toast.success('Incident unlinked from problem');
      await fetchProblemDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unlink incident';
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="text-center py-16">
        <FileQuestion className="h-12 w-12 mx-auto text-slate-400" />
        <h3 className="mt-4 text-base font-semibold text-slate-800">Problem not found</h3>
        <Button onClick={() => navigate('/problems')} className="mt-4">
          Back to Problems
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/problems')}
          className="gap-2 text-slate-500 hover:text-slate-900 -ml-2 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Problems
        </Button>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Created:</span>
          <span className="font-medium text-slate-700">
            {new Date(problem.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Problem Title Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-blue-600">
                  {problem.problemNumber}
                </span>
                <ProblemStatusBadge status={problem.status} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{problem.title}</h1>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Details, Workaround, Root Cause, Linked Incidents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Symptoms & Description */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Problem Description & Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {problem.description}
              </p>
            </CardContent>
          </Card>

          {/* Workaround Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold text-slate-800">
                Workaround / Temporary Mitigation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {isAgentOrAdmin ? (
                <textarea
                  rows={3}
                  value={workaround}
                  onChange={(e) => setWorkaround(e.target.value)}
                  placeholder="Document interim recovery steps to restore service..."
                  className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {problem.workaround || 'No workaround documented yet.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Root Cause Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold text-slate-800">
                Root Cause Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {isAgentOrAdmin ? (
                <textarea
                  rows={3}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Document the underlying technical cause..."
                  className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {problem.rootCause || 'Root cause investigation in progress.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Linked Incidents Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Linked Related Incidents ({problem.incidents?.length ?? 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Link Incident Input for Agents/Admins */}
              {isAgentOrAdmin ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <select
                    value={selectedIncidentToLink}
                    onChange={(e) => setSelectedIncidentToLink(e.target.value)}
                    className="flex-1 h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Incident to Link to Problem --</option>
                    {availableIncidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        {inc.ticketNumber}: {inc.shortDescription} ({inc.status})
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleLinkIncident}
                    disabled={!selectedIncidentToLink || isLinking}
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  >
                    {isLinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Link Incident
                  </Button>
                </div>
              ) : null}

              {/* Incidents Table / List */}
              {(!problem.incidents || problem.incidents.length === 0) ? (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  No incidents linked to this problem record.
                </p>
              ) : (
                <div className="space-y-2">
                  {problem.incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 bg-white shadow-2xs gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/incidents/${inc.id}`}
                            className="font-mono text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            {inc.ticketNumber}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <IncidentStatusBadge status={inc.status} />
                          <IncidentPriorityBadge priority={inc.priority} />
                        </div>
                        <p className="text-xs font-medium text-slate-800">{inc.shortDescription}</p>
                      </div>

                      {isAgentOrAdmin ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlinkIncident(inc.id)}
                          className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 h-8 self-end sm:self-center"
                        >
                          <Unlink className="h-3.5 w-3.5 mr-1" />
                          Unlink
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Status & Assignment */}
        <div className="space-y-6">
          {isAgentOrAdmin ? (
            <Card className="border-blue-200 bg-blue-50/20 shadow-sm">
              <CardHeader className="border-b border-blue-100 pb-3">
                <CardTitle className="text-sm font-semibold text-blue-900">
                  Problem Investigation Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Status Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="probStatus" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    id="probStatus"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ProblemStatus)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OPEN">Open</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {/* Owner Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="probOwner" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Lead Investigator
                  </label>
                  <select
                    id="probOwner"
                    value={selectedOwner}
                    onChange={(e) => setSelectedOwner(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.firstName} {ag.lastName} ({ag.role})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white mt-2"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* Owner Meta Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Owner Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Assigned Lead</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {problem.owner ? `${problem.owner.firstName} ${problem.owner.lastName}` : 'Unassigned'}
                  </p>
                  <p className="text-xs text-slate-500">{problem.owner?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
