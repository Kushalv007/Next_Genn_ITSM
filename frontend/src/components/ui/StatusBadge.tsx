import { Badge } from '@/components/ui/badge';
import type { IncidentStatus, IncidentPriority, RequestStatus } from '@/types';

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  switch (status) {
    case 'NEW':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">New</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
    case 'PENDING':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Pending</Badge>;
    case 'RESOLVED':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Resolved</Badge>;
    case 'CLOSED':
      return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Closed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function IncidentPriorityBadge({ priority }: { priority: IncidentPriority }) {
  switch (priority) {
    case 'LOW':
      return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Low</Badge>;
    case 'MEDIUM':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Medium</Badge>;
    case 'HIGH':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
    case 'CRITICAL':
      return <Badge className="bg-red-100 text-red-800 border-red-200 font-bold">Critical</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  switch (status) {
    case 'SUBMITTED':
      return <Badge className="bg-sky-100 text-sky-800 border-sky-200">Submitted</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Completed</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
    case 'CANCELLED':
      return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function ApprovalStatusBadge({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  switch (status) {
    case 'PENDING':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Approval Pending</Badge>;
    case 'APPROVED':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Approved</Badge>;
    case 'REJECTED':
      return <Badge className="bg-rose-100 text-rose-800 border-rose-300">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ArticleStatusBadge({ status }: { status: 'DRAFT' | 'PUBLISHED' }) {
  switch (status) {
    case 'DRAFT':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Draft</Badge>;
    case 'PUBLISHED':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Published</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ProblemStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'OPEN':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Open</Badge>;
    case 'INVESTIGATING':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Investigating</Badge>;
    case 'RESOLVED':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Resolved</Badge>;
    case 'CLOSED':
      return <Badge className="bg-slate-100 text-slate-700 border-slate-300">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ChangeStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'DRAFT':
      return <Badge className="bg-slate-100 text-slate-700 border-slate-300">Draft</Badge>;
    case 'PENDING_APPROVAL':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Pending Approval</Badge>;
    case 'APPROVED':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Approved</Badge>;
    case 'IMPLEMENTATION':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Implementation</Badge>;
    case 'CLOSED':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Closed</Badge>;
    case 'REJECTED':
      return <Badge className="bg-rose-100 text-rose-800 border-rose-300">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ChangeRiskBadge({ risk }: { risk: string }) {
  switch (risk) {
    case 'LOW':
      return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Low Risk</Badge>;
    case 'MEDIUM':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Medium Risk</Badge>;
    case 'HIGH':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High Risk</Badge>;
    case 'CRITICAL':
      return <Badge className="bg-red-100 text-red-800 border-red-200 font-bold">Critical Risk</Badge>;
    default:
      return <Badge variant="outline">{risk}</Badge>;
  }
}

export function AssetStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'AVAILABLE':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Available</Badge>;
    case 'ASSIGNED':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Assigned</Badge>;
    case 'IN_REPAIR':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300">In Repair</Badge>;
    case 'RETIRED':
      return <Badge className="bg-slate-100 text-slate-600 border-slate-300">Retired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}


