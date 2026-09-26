import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User as UserIcon,
  Package,
  Save,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestStatusBadge, ApprovalStatusBadge } from '@/components/ui/StatusBadge';
import { getRequest, updateRequest, approveOrRejectRequest } from '@/api/catalog';
import { getAgents } from '@/api/incidents';
import { useAuthStore } from '@/store/auth';
import type { ServiceRequest, RequestStatus, User } from '@/types';
import { toast } from 'sonner';

export function RequestDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAgentOrAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Technician';

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState<User[]>([]);

  // Triage state
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus>('SUBMITTED');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const fetchRequestDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getRequest(id);
      setRequest(data);
      setSelectedStatus(data.status);
      setSelectedAssignee(data.assignedToId ?? '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load service request';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchRequestDetails();
  }, [fetchRequestDetails]);

  useEffect(() => {
    if (isAgentOrAdmin) {
      getAgents()
        .then(setAgents)
        .catch(() => toast.error('Failed to load agents list'));
    }
  }, [isAgentOrAdmin]);

  const handleUpdate = async () => {
    if (!request) return;
    try {
      setIsUpdating(true);
      const updated = await updateRequest(request.id, {
        status: selectedStatus,
        assignedToId: selectedAssignee || null,
      });
      setRequest(updated);
      toast.success('Service request updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update request';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproval = async (status: 'APPROVED' | 'REJECTED') => {
    if (!request) return;
    try {
      setIsSubmittingApproval(true);
      const updated = await approveOrRejectRequest(request.id, status);
      setRequest(updated);
      setSelectedStatus(updated.status);
      toast.success(`Request ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${status.toLowerCase()} request`;
      toast.error(msg);
    } finally {
      setIsSubmittingApproval(false);
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

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Service request not found or you lack permission to view it.</p>
        <Button onClick={() => navigate('/requests')} className="mt-4">
          Back to Requests
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
          onClick={() => navigate('/requests')}
          className="gap-2 text-slate-500 hover:text-slate-900 -ml-2 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Button>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Submitted:</span>
          <span className="font-medium text-slate-700">
            {new Date(request.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Header Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-blue-600">
                  {request.requestNumber}
                </span>
                <RequestStatusBadge status={request.status} />
                <ApprovalStatusBadge status={request.approvalStatus} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {request.catalogItem?.name}
              </h1>
              <p className="text-xs text-slate-500">
                Category: <strong className="text-slate-700">{request.catalogItem?.category}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Justification and Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base font-semibold text-slate-800">
                  Business Justification & Requirement
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {request.description}
              </p>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Service Catalog Item Specs
                </h4>
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                  <p className="font-medium text-slate-800 mb-1">{request.catalogItem?.name}</p>
                  <p>{request.catalogItem?.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Meta & Agent Management */}
        <div className="space-y-6">
          {/* Request Approval Card */}
          <Card
            className={`border shadow-sm ${
              request.approvalStatus === 'APPROVED'
                ? 'border-emerald-200 bg-emerald-50/20'
                : request.approvalStatus === 'REJECTED'
                ? 'border-rose-200 bg-rose-50/20'
                : 'border-amber-200 bg-amber-50/20'
            }`}
          >
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                {request.approvalStatus === 'APPROVED' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : request.approvalStatus === 'REJECTED' ? (
                  <XCircle className="h-4 w-4 text-rose-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Manager Approval
                </CardTitle>
              </div>
              <ApprovalStatusBadge status={request.approvalStatus} />
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {request.approvalStatus === 'PENDING' ? (
                <>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This service request requires manager authorization before fulfillment can proceed.
                  </p>
                  {isAgentOrAdmin ? (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleApproval('APPROVED')}
                        disabled={isSubmittingApproval}
                        className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        {isSubmittingApproval ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval('REJECTED')}
                        disabled={isSubmittingApproval}
                        className="flex-1 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 shadow-xs"
                      >
                        {isSubmittingApproval ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ThumbsDown className="h-3.5 w-3.5" />
                        )}
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 border border-amber-200">
                      Awaiting manager or administrator review.
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Decision:</span>
                    <span
                      className={`font-semibold ${
                        request.approvalStatus === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {request.approvalStatus}
                    </span>
                  </div>
                  {request.approver ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Reviewed By:</span>
                      <span className="font-medium text-slate-800">
                        {request.approver.firstName} {request.approver.lastName}
                      </span>
                    </div>
                  ) : null}
                  {request.approvedAt ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Timestamp:</span>
                      <span className="text-slate-600">
                        {new Date(request.approvedAt).toLocaleString()}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Triage / Management Panel */}
          {isAgentOrAdmin ? (
            <Card className="border-blue-200 bg-blue-50/20 shadow-sm">
              <CardHeader className="border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base font-semibold text-blue-900">
                    Fulfillment & Triage
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Status Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="reqStatusSelect" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Fulfillment Status
                  </label>
                  <select
                    id="reqStatusSelect"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as RequestStatus)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Assignee Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="reqAgentSelect" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Assigned Agent
                  </label>
                  <select
                    id="reqAgentSelect"
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

                {/* Save Changes Button */}
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white mt-2"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Update Fulfillment
                </Button>
              </CardContent>
            </Card>
          ) : null}

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
                    {request.requester ? `${request.requester.firstName} ${request.requester.lastName}` : '-'}
                  </p>
                  <p className="text-xs text-slate-500">{request.requester?.email}</p>
                </div>
              </div>

              {/* Assignee Info */}
              <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Assigned Agent</p>
                  {request.assignedTo ? (
                    <>
                      <p className="text-sm font-semibold text-slate-900">
                        {request.assignedTo.firstName} {request.assignedTo.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{request.assignedTo.email}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Not assigned yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
