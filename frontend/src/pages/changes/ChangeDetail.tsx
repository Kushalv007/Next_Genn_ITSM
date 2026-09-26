import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User as UserIcon,
  Calendar,
  FileText,
  RotateCcw,
  ShieldCheck,
  Play,
  CheckCheck,
  Send,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChangeStatusBadge, ChangeRiskBadge } from '@/components/ui/StatusBadge';
import {
  getChange,
  approveOrRejectChange,
  updateChangeStatus,
  updateChange,
} from '@/api/changes';
import { useAuthStore } from '@/store/auth';
import type { Change, ChangeStatus } from '@/types';
import { toast } from 'sonner';

export function ChangeDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAgentOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Technician';

  const [change, setChange] = useState<Change | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit mode for draft changes
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImplPlan, setEditImplPlan] = useState('');
  const [editRollbackPlan, setEditRollbackPlan] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState('');

  const fetchChange = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getChange(id);
      setChange(data);
      setEditTitle(data.title);
      setEditDesc(data.description);
      setEditImplPlan(data.implementationPlan);
      setEditRollbackPlan(data.rollbackPlan);
      setEditScheduledDate(
        data.scheduledDate ? new Date(data.scheduledDate).toISOString().slice(0, 16) : ''
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load change details';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchChange();
  }, [fetchChange]);

  const handleApproval = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!change) return;
    try {
      setIsProcessing(true);
      const updated = await approveOrRejectChange(change.id, decision);
      setChange(updated);
      toast.success(
        decision === 'APPROVED'
          ? 'Change successfully approved'
          : 'Change rejected'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${decision.toLowerCase()} change`;
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusTransition = async (newStatus: ChangeStatus) => {
    if (!change) return;
    try {
      setIsProcessing(true);
      const updated = await updateChangeStatus(change.id, newStatus);
      setChange(updated);
      toast.success(`Change status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to transition change status';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!change) return;
    try {
      setIsProcessing(true);
      const updated = await updateChange(change.id, {
        title: editTitle,
        description: editDesc,
        implementationPlan: editImplPlan,
        rollbackPlan: editRollbackPlan,
        scheduledDate: editScheduledDate ? new Date(editScheduledDate).toISOString() : null,
      });
      setChange(updated);
      setIsEditing(false);
      toast.success('Change updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update change';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!change) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">Change record not found</h2>
        <p className="text-slate-500 mt-2">The requested change may have been removed or does not exist.</p>
        <Button onClick={() => navigate('/changes')} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Changes
        </Button>
      </div>
    );
  }

  const isOwner = currentUser?.id === change.ownerId;
  const canEdit = (isOwner || isAgentOrAdmin) && (change.status === 'DRAFT' || change.status === 'PENDING_APPROVAL');

  // Progression steps
  const steps = [
    { label: 'Draft', status: 'DRAFT' },
    { label: 'Pending Approval', status: 'PENDING_APPROVAL' },
    { label: 'Approved', status: 'APPROVED' },
    { label: 'Implementation', status: 'IMPLEMENTATION' },
    { label: 'Closed', status: 'CLOSED' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.status === change.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/changes')}
            className="text-slate-500 hover:text-slate-900 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Changes
          </Button>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {change.changeNumber}
            </span>
            <ChangeStatusBadge status={change.status} />
            <ChangeRiskBadge risk={change.risk} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && !isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit Details
            </Button>
          ) : null}
        </div>
      </div>

      {/* Main Title & Lifecycle Tracker */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{change.title}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Requested by {change.owner ? `${change.owner.firstName} ${change.owner.lastName}` : 'Unknown'} on{' '}
          {new Date(change.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stepper (Lifecycle) */}
      {change.status !== 'REJECTED' ? (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />
            {steps.map((s, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={s.status} className="flex flex-col items-center relative z-10 bg-white px-2">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-50'
                        : isPast
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPast && !isCurrent ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                      isCurrent
                        ? 'text-blue-700 font-semibold'
                        : isPast
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 flex items-center gap-3">
          <XCircle className="h-6 w-6 text-rose-600 shrink-0" />
          <div>
            <div className="font-semibold text-sm">Change Request Rejected</div>
            <div className="text-xs text-rose-700 mt-0.5">
              This change proposal was rejected by{' '}
              {change.approver
                ? `${change.approver.firstName} ${change.approver.lastName}`
                : 'an authorized manager'}.
            </div>
          </div>
        </div>
      )}

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Content & Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form or View Cards */}
          {isEditing ? (
            <Card className="border-blue-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Edit Change Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Description</label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Implementation Plan</label>
                  <textarea
                    rows={4}
                    value={editImplPlan}
                    onChange={(e) => setEditImplPlan(e.target.value)}
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm font-mono bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Rollback Plan</label>
                  <textarea
                    rows={3}
                    value={editRollbackPlan}
                    onChange={(e) => setEditRollbackPlan(e.target.value)}
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm font-mono bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Scheduled Date</label>
                  <input
                    type="datetime-local"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-white text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={isProcessing}
                    onClick={handleSaveEdit}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Description Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Change Scope & Justification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {change.description}
                  </p>
                </CardContent>
              </Card>

              {/* Implementation Plan Card */}
              <Card className="shadow-sm border-blue-100">
                <CardHeader className="pb-3 bg-blue-50/40 rounded-t-xl border-b border-blue-50">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    Implementation Plan
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-700">
                    Detailed step-by-step execution procedures during maintenance window
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="text-sm text-slate-800 font-mono whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200/80 leading-relaxed overflow-x-auto">
                    {change.implementationPlan || 'No implementation procedure specified.'}
                  </pre>
                </CardContent>
              </Card>

              {/* Rollback Plan Card */}
              <Card className="shadow-sm border-amber-100">
                <CardHeader className="pb-3 bg-amber-50/40 rounded-t-xl border-b border-amber-50">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                    <RotateCcw className="h-4 w-4 text-amber-600" />
                    Rollback & Contingency Plan
                  </CardTitle>
                  <CardDescription className="text-xs text-amber-700">
                    Safe restoration steps in case of service degradation or validation failure
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="text-sm text-slate-800 font-mono whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200/80 leading-relaxed overflow-x-auto">
                    {change.rollbackPlan || 'No rollback steps documented.'}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Right 1 Col: Actions & Metadata */}
        <div className="space-y-6">
          {/* Approval Actions Card (Managers & Admins) */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Change Workflow Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Draft -> Submit for Approval */}
              {change.status === 'DRAFT' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Submit this draft proposal to managers and IT leadership for review.
                  </p>
                  <Button
                    onClick={() => handleStatusTransition('PENDING_APPROVAL')}
                    disabled={isProcessing}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit for Approval
                  </Button>
                </div>
              )}

              {/* Pending Approval -> Approve or Reject */}
              {change.status === 'PENDING_APPROVAL' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This change is currently waiting for authorization. Authorized Managers/Admins can approve or reject.
                  </p>

                  {isAgentOrAdmin ? (
                    <div className="flex flex-col gap-2 pt-1">
                      <Button
                        onClick={() => handleApproval('APPROVED')}
                        disabled={isProcessing}
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve Change
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleApproval('REJECTED')}
                        disabled={isProcessing}
                        className="w-full gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Reject Change
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 flex items-start gap-2">
                      <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Awaiting review by an IT Manager or Administrator.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Approved -> Start Implementation */}
              {change.status === 'APPROVED' && (
                <div className="space-y-2">
                  <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">
                        Approved by{' '}
                        {change.approver
                          ? `${change.approver.firstName} ${change.approver.lastName}`
                          : 'Manager'}
                      </span>
                      {change.approvedAt && (
                        <p className="text-emerald-700 mt-0.5">
                          {new Date(change.approvedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {isAgentOrAdmin && (
                    <Button
                      onClick={() => handleStatusTransition('IMPLEMENTATION')}
                      disabled={isProcessing}
                      className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm mt-2"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Start Implementation
                    </Button>
                  )}
                </div>
              )}

              {/* Implementation -> Close */}
              {change.status === 'IMPLEMENTATION' && (
                <div className="space-y-2">
                  <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200 flex items-start gap-2">
                    <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Under Active Implementation</span>
                      <p className="text-blue-700 mt-0.5">
                        Maintenance and engineering work is currently underway.
                      </p>
                    </div>
                  </div>

                  {isAgentOrAdmin && (
                    <Button
                      onClick={() => handleStatusTransition('CLOSED')}
                      disabled={isProcessing}
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm mt-2"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                      Complete & Close Change
                    </Button>
                  )}
                </div>
              )}

              {/* Closed / Rejected Terminal States */}
              {change.status === 'CLOSED' && (
                <div className="rounded-lg bg-slate-100 p-3 text-xs text-slate-700 border border-slate-200 flex items-center gap-2">
                  <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>This change is completed and closed.</span>
                </div>
              )}

              {change.status === 'REJECTED' && (
                <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>This change proposal has been rejected.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Details / Specifications Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-900">Change Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs text-slate-500 font-medium">Risk Level</span>
                <ChangeRiskBadge risk={change.risk} />
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs text-slate-500 font-medium">Lifecycle Status</span>
                <ChangeStatusBadge status={change.status} />
              </div>

              <div className="border-b pb-2">
                <span className="text-xs text-slate-500 font-medium block mb-1">Scheduled Window</span>
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                  <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>
                    {change.scheduledDate
                      ? new Date(change.scheduledDate).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Unscheduled'}
                  </span>
                </div>
              </div>

              <div className="border-b pb-2">
                <span className="text-xs text-slate-500 font-medium block mb-1">Change Owner</span>
                <div className="flex items-center gap-2 text-slate-800">
                  <UserIcon className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="font-medium">
                      {change.owner ? `${change.owner.firstName} ${change.owner.lastName}` : 'Unassigned'}
                    </div>
                    {change.owner?.email && (
                      <div className="text-xs text-slate-500">{change.owner.email}</div>
                    )}
                  </div>
                </div>
              </div>

              {change.approver && (
                <div className="border-b pb-2">
                  <span className="text-xs text-slate-500 font-medium block mb-1">
                    {change.status === 'REJECTED' ? 'Rejected By' : 'Approved By'}
                  </span>
                  <div className="flex items-center gap-2 text-slate-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-medium">
                        {change.approver.firstName} {change.approver.lastName}
                      </div>
                      {change.approvedAt && (
                        <div className="text-xs text-slate-500">
                          {new Date(change.approvedAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs text-slate-500 font-medium block mb-1">Created At</span>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{new Date(change.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default ChangeDetail;
