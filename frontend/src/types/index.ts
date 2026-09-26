export type Role = 'Admin' | 'Technician' | 'User';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface LoginResponse {
  user: User;
  tokens: Tokens;
}

export type IncidentStatus = 'NEW' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IncidentComment {
  id: string;
  incidentId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface Incident {
  id: string;
  ticketNumber: string;
  shortDescription: string;
  description: string;
  category: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  requesterId: string;
  assignedToId?: string | null;
  resolutionNotes?: string | null;
  slaDeadline?: string | null;
  slaBreached?: boolean;
  resolvedAt?: string | null;
  assetId?: string | null;
  problemId?: string | null;
  createdAt: string;
  updatedAt: string;
  requester: User;
  assignedTo?: User | null;
  asset?: Asset | null;
  problem?: Problem | null;
  comments?: IncidentComment[];
  _count?: {
    comments: number;
  };
}

export interface CreateIncidentDto {
  shortDescription: string;
  description: string;
  category: string;
  priority?: IncidentPriority;
  assetId?: string | null;
}

export interface UpdateIncidentDto {
  status?: IncidentStatus;
  priority?: IncidentPriority;
  assignedToId?: string | null;
  resolutionNotes?: string;
  assetId?: string | null;
  problemId?: string | null;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  serviceCatalogItemId: string;
  requesterId: string;
  description: string;
  status: RequestStatus;
  approvalStatus: ApprovalStatus;
  approverId?: string | null;
  approvedAt?: string | null;
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
  catalogItem: ServiceCatalogItem;
  requester: User;
  assignedTo?: User | null;
  approver?: User | null;
}

export interface CreateServiceRequestDto {
  serviceCatalogItemId: string;
  description: string;
}

export interface UpdateServiceRequestDto {
  status?: RequestStatus;
  assignedToId?: string | null;
}

export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
  author: User;
}

export interface CreateKnowledgeArticleDto {
  title: string;
  content: string;
  category: string;
  status?: ArticleStatus;
}

export interface UpdateKnowledgeArticleDto {
  title?: string;
  content?: string;
  category?: string;
  status?: ArticleStatus;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface StatCard {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend: {
    value: number;
    isUp: boolean;
  };
  color: string;
}

// Step 7: Problem Management
export type ProblemStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

export interface Problem {
  id: string;
  problemNumber: string;
  title: string;
  description: string;
  status: ProblemStatus;
  rootCause?: string | null;
  workaround?: string | null;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: User | null;
  incidents?: Incident[];
  _count?: {
    incidents: number;
  };
}

export interface CreateProblemDto {
  title: string;
  description: string;
  ownerId?: string;
  rootCause?: string;
  workaround?: string;
}

export interface UpdateProblemDto {
  title?: string;
  description?: string;
  status?: ProblemStatus;
  ownerId?: string | null;
  rootCause?: string;
  workaround?: string;
}

// Step 7: Change Management
export type ChangeStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IMPLEMENTATION' | 'CLOSED' | 'REJECTED';

export type ChangeRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Change {
  id: string;
  changeNumber: string;
  title: string;
  description: string;
  risk: ChangeRisk;
  implementationPlan: string;
  rollbackPlan: string;
  scheduledDate?: string | null;
  status: ChangeStatus;
  ownerId: string;
  approverId?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: User;
  approver?: User | null;
}

export interface CreateChangeDto {
  title: string;
  description: string;
  risk?: ChangeRisk;
  implementationPlan: string;
  rollbackPlan: string;
  scheduledDate?: string | null;
}

export interface UpdateChangeDto {
  title?: string;
  description?: string;
  risk?: ChangeRisk;
  implementationPlan?: string;
  rollbackPlan?: string;
  scheduledDate?: string | null;
  status?: ChangeStatus;
}

// Step 7: Asset Management
export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'IN_REPAIR' | 'RETIRED';

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  status: AssetStatus;
  assignedToId?: string | null;
  locationId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: User | null;
  incidents?: Incident[];
  _count?: {
    incidents: number;
  };
}

export interface CreateAssetDto {
  assetTag?: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  status?: AssetStatus;
  assignedToId?: string | null;
  locationId?: string | null;
}

export interface UpdateAssetDto {
  assetTag?: string;
  name?: string;
  type?: string;
  model?: string;
  serialNumber?: string;
  status?: AssetStatus;
  assignedToId?: string | null;
  locationId?: string | null;
}

