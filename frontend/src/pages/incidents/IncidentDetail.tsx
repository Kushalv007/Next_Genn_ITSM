import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User as UserIcon,
  ShieldAlert,
  Send,
  Loader2,
  CheckCircle2,
  Save,
  MessageSquare,
  Timer,
  AlertOctagon,
  Laptop,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IncidentStatusBadge,
  IncidentPriorityBadge,
  AssetStatusBadge,
  ProblemStatusBadge,
} from '@/components/ui/StatusBadge';
import {
  getIncident,
  updateIncident,
  addComment,
  getAgents,
} from '@/api/incidents';
import { getAssets } from '@/api/assets';
import { getProblems } from '@/api/problems';
import { useAuthStore } from '@/store/auth';
import type {
  Incident,
  IncidentStatus,
  IncidentPriority,
  User,
  Asset,
  Problem,
} from '@/types';
import { toast } from 'sonner';

export function IncidentDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAgentOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Technician';

  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState<User[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);

  // Triage state for Agent/Admin
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus>('NEW');
  const [selectedPriority, setSelectedPriority] = useState<IncidentPriority>('MEDIUM');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchIncidentDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getIncident(id);
      setIncident(data);
      setSelectedStatus(data.status);
      setSelectedPriority(data.priority);
      setSelectedAssignee(data.assignedToId ?? '');
      setSelectedAssetId(data.assetId ?? '');
      setSelectedProblemId(data.problemId ?? '');
      setResolutionNotes(data.resolutionNotes ?? '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load incident';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchIncidentDetails();
  }, [fetchIncidentDetails]);

  useEffect(() => {
    if (isAgentOrAdmin) {
      getAgents()
        .then(setAgents)
        .catch(() => toast.error('Failed to load agents list'));
      getAssets()
        .then(setAvailableAssets)
        .catch(() => {});
      getProblems()
        .then(setAvailableProblems)
        .catch(() => {});
    }
  }, [isAgentOrAdmin]);

  const handleUpdateStatusAndAssignment = async () => {
    if (!incident) return;
    try {
      setIsUpdating(true);
      const updated = await updateIncident(incident.id, {
        status: selectedStatus,
        priority: selectedPriority,
        assignedToId: selectedAssignee || null,
        assetId: selectedAssetId || null,
        problemId: selectedProblemId || null,
        resolutionNotes: resolutionNotes || undefined,
      });
      setIncident(updated);
      toast.success('Incident updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update incident';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !commentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      const newComment = await addComment(incident.id, commentText);
      setIncident({
        ...incident,
        comments: [...(incident.comments ?? []), newComment],
      });
      setCommentText('');
      toast.success('Comment added');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add comment';
      toast.error(msg);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Incident not found or you lack permission to view it.</p>
        <Button onClick={() => navigate('/incidents')} className="mt-4">
          Back to Incidents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/incidents')}
          className="gap-2 text-slate-500 hover:text-slate-900 -ml-2 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Incidents
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Created:</span>
          <span className="text-xs font-medium text-slate-600">
            {new Date(incident.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Ticket Header Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-blue-600">
                  {incident.ticketNumber}
                </span>
                <IncidentStatusBadge status={incident.status} />
                <IncidentPriorityBadge priority={incident.priority} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {incident.shortDescription}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Category: <strong className="text-slate-700">{incident.category}</strong></span>
                <span>•</span>
                <span>Last updated: {new Date(incident.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Description, Resolution, Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">
                Incident Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {incident.description}
              </p>
            </CardContent>
          </Card>

          {/* Resolution Notes (if any or if resolved) */}
          {incident.resolutionNotes ? (
            <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm">
              <CardHeader className="border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base font-semibold text-emerald-900">
                    Resolution Notes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-emerald-950 whitespace-pre-wrap leading-relaxed">
                  {incident.resolutionNotes}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Comments and Activity Section */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-slate-600" />
                <CardTitle className="text-base font-semibold text-slate-800">
                  Activity & Communication ({incident.comments?.length ?? 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Post a comment or update to this ticket..."
                  className="w-full rounded-md border border-slate-200 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    size="sm"
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Post Comment
                  </Button>
                </div>
              </form>

              {/* Comment Timeline */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {incident.comments && incident.comments.length > 0 ? (
                  incident.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'System'}
                          </span>
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                            {comment.user?.role ?? 'User'}
                          </span>
                        </div>
                        <span className="text-slate-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    No comments yet. Post the first update above.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Meta, People, Triage Controls */}
        <div className="space-y-6">
          {/* Agent Triage / Management Panel */}
          {isAgentOrAdmin ? (
            <Card className="border-blue-200 bg-blue-50/20 shadow-sm">
              <CardHeader className="border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base font-semibold text-blue-900">
                    Triage & Management
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Status Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="statusSelect" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Ticket Status
                  </label>
                  <select
                    id="statusSelect"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as IncidentStatus)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NEW">New</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="PENDING">Pending</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="prioritySelect" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Priority Level
                  </label>
                  <select
                    id="prioritySelect"
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as IncidentPriority)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                {/* Assignee Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="agentSelect" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Assigned Agent
                  </label>
                  <select
                    id="agentSelect"
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
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

                {/* Affected Asset Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="assetSelect" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Affected Asset
                  </label>
                  <select
                    id="assetSelect"
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- No Asset Linked --</option>
                    {availableAssets.map((ast) => (
                      <option key={ast.id} value={ast.id}>
                        [{ast.assetTag}] {ast.name} ({ast.model})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Linked Problem Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="problemSelect" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Root Problem
                  </label>
                  <select
                    id="problemSelect"
                    value={selectedProblemId}
                    onChange={(e) => setSelectedProblemId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- No Problem Linked --</option>
                    {availableProblems.map((prb) => (
                      <option key={prb.id} value={prb.id}>
                        [{prb.problemNumber}] {prb.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resolution Notes input if status is Resolved/Closed */}
                {(selectedStatus === 'RESOLVED' || selectedStatus === 'CLOSED') ? (
                  <div className="space-y-1.5 pt-2 border-t border-blue-100">
                    <label htmlFor="resNotes" className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      Resolution Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="resNotes"
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Detail the root cause and steps taken to remediate..."
                      className="w-full rounded-md border border-emerald-200 bg-white p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ) : null}

                {/* Save Changes Button */}
                <Button
                  onClick={handleUpdateStatusAndAssignment}
                  disabled={isUpdating}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white mt-2"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* SLA Management Card */}
          {incident.slaDeadline ? (() => {
            const isResolvedOrClosed = incident.status === 'RESOLVED' || incident.status === 'CLOSED';
            const SLA_TARGETS: Record<IncidentPriority, string> = {
              CRITICAL: '2 hours',
              HIGH: '4 hours',
              MEDIUM: '8 hours',
              LOW: '24 hours',
            };
            const targetTime = SLA_TARGETS[incident.priority] || '8 hours';
            const deadlineMs = new Date(incident.slaDeadline).getTime();
            const diffMs = deadlineMs - Date.now();

            let slaStatusBadge: JSX.Element;
            let statusText: string;

            if (isResolvedOrClosed) {
              if (incident.slaBreached) {
                slaStatusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 border border-red-200">
                    <AlertOctagon className="h-3 w-3" /> SLA Breached
                  </span>
                );
                statusText = incident.resolvedAt
                  ? `Target missed. Resolved at ${new Date(incident.resolvedAt).toLocaleString()}`
                  : 'Resolution exceeded target deadline.';
              } else {
                slaStatusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> SLA Met
                  </span>
                );
                statusText = incident.resolvedAt
                  ? `Resolved within target at ${new Date(incident.resolvedAt).toLocaleString()}`
                  : 'Target fulfilled on time.';
              }
            } else if (diffMs > 0) {
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              slaStatusBadge = (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
                  <Timer className="h-3 w-3" /> Active
                </span>
              );
              statusText = `${hours}h ${mins}m remaining`;
            } else {
              const overdueMs = Math.abs(diffMs);
              const hours = Math.floor(overdueMs / (1000 * 60 * 60));
              const mins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
              slaStatusBadge = (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 border border-red-200">
                  <AlertOctagon className="h-3 w-3" /> Overdue
                </span>
              );
              statusText = `Overdue by ${hours}h ${mins}m`;
            }

            return (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-semibold text-slate-700">
                      SLA Resolution Target
                    </CardTitle>
                  </div>
                  {slaStatusBadge}
                </CardHeader>
                <CardContent className="p-5 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Policy Target ({incident.priority}):</span>
                    <span className="font-semibold text-slate-800">{targetTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Deadline:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(incident.slaDeadline).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-400">Current Status:</span>
                    <span className={`font-semibold ${
                      incident.slaBreached || (!isResolvedOrClosed && diffMs <= 0)
                        ? 'text-red-600'
                        : isResolvedOrClosed
                        ? 'text-emerald-600'
                        : 'text-blue-600'
                    }`}>
                      {statusText}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })() : null}

          {/* People & Stakeholders Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                People & Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Requester Info */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Requester</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {incident.requester ? `${incident.requester.firstName} ${incident.requester.lastName}` : '-'}
                  </p>
                  <p className="text-xs text-slate-500">{incident.requester?.email}</p>
                </div>
              </div>

              {/* Assignee Info */}
              <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Assigned Agent</p>
                  {incident.assignedTo ? (
                    <>
                      <p className="text-sm font-semibold text-slate-900">
                        {incident.assignedTo.firstName} {incident.assignedTo.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{incident.assignedTo.email}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Not assigned yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Asset Card */}
          {incident.asset && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm font-semibold text-slate-700">
                    Affected Asset
                  </CardTitle>
                </div>
                <AssetStatusBadge status={incident.asset.status} />
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-700">{incident.asset.assetTag}</span>
                  <Link
                    to={`/assets/${incident.asset.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <span>View Asset</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <p className="font-medium text-slate-900 text-sm">{incident.asset.name}</p>
                <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
                  <span>Model:</span>
                  <span className="font-mono font-medium text-slate-700">{incident.asset.model}</span>
                </div>
                {incident.asset.locationId && (
                  <div className="flex justify-between text-slate-500">
                    <span>Location:</span>
                    <span className="font-medium text-slate-700">{incident.asset.locationId}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Linked Problem Card */}
          {incident.problem && (
            <Card className="border-amber-200 bg-amber-50/20 shadow-sm">
              <CardHeader className="border-b border-amber-100 pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-amber-600" />
                  <CardTitle className="text-sm font-semibold text-amber-900">
                    Root Problem
                  </CardTitle>
                </div>
                <ProblemStatusBadge status={incident.problem.status} />
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-800">
                    {incident.problem.problemNumber}
                  </span>
                  <Link
                    to={`/problems/${incident.problem.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <span>View Problem</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <p className="font-medium text-slate-900 text-sm">{incident.problem.title}</p>
                {incident.problem.workaround && (
                  <div className="pt-2 border-t border-amber-100">
                    <span className="font-semibold text-amber-900 block mb-1">Known Workaround:</span>
                    <p className="text-slate-700 bg-white p-2 rounded border border-amber-100 leading-relaxed font-mono">
                      {incident.problem.workaround}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
