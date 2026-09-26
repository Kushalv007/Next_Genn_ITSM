import apiClient from './client';
import type {
  ApiResponse,
  Change,
  CreateChangeDto,
  UpdateChangeDto,
  ChangeStatus,
} from '@/types';

export interface ChangeQueryParams {
  status?: string;
  risk?: string;
  search?: string;
  ownerId?: string;
}

export const getChanges = async (params: ChangeQueryParams = {}): Promise<Change[]> => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.risk && params.risk !== 'ALL') query.append('risk', params.risk);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.ownerId) query.append('ownerId', params.ownerId);

  const queryString = query.toString();
  const url = queryString ? `/changes?${queryString}` : '/changes';

  const response = await apiClient.get<ApiResponse<Change[]>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch changes');
  }
  return response.data.data ?? [];
};

export const getChange = async (id: string): Promise<Change> => {
  const response = await apiClient.get<ApiResponse<Change>>(`/changes/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch change details');
  }
  return response.data.data as Change;
};

export const createChange = async (data: CreateChangeDto): Promise<Change> => {
  const response = await apiClient.post<ApiResponse<Change>>('/changes', data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to create change');
  }
  return response.data.data as Change;
};

export const updateChange = async (id: string, data: UpdateChangeDto): Promise<Change> => {
  const response = await apiClient.put<ApiResponse<Change>>(`/changes/${id}`, data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to update change');
  }
  return response.data.data as Change;
};

export const approveOrRejectChange = async (
  id: string,
  decision: 'APPROVED' | 'REJECTED'
): Promise<Change> => {
  const response = await apiClient.post<ApiResponse<Change>>(`/changes/${id}/approval`, {
    decision,
  });
  if (!response.data.success) {
    throw new Error(response.data.message ?? `Failed to ${decision.toLowerCase()} change`);
  }
  return response.data.data as Change;
};

export const updateChangeStatus = async (
  id: string,
  status: ChangeStatus
): Promise<Change> => {
  const response = await apiClient.patch<ApiResponse<Change>>(`/changes/${id}/status`, {
    status,
  });
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to update change status');
  }
  return response.data.data as Change;
};
