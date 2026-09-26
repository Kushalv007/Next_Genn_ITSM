import apiClient from './client';
import type {
  ApiResponse,
  Incident,
  CreateIncidentDto,
  UpdateIncidentDto,
  IncidentComment,
  User,
} from '@/types';

export interface IncidentQueryParams {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  assignedToId?: string;
}

export const getIncidents = async (params: IncidentQueryParams = {}): Promise<Incident[]> => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.priority && params.priority !== 'ALL') query.append('priority', params.priority);
  if (params.category && params.category !== 'ALL') query.append('category', params.category);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.assignedToId) query.append('assignedToId', params.assignedToId);

  const queryString = query.toString();
  const url = queryString ? `/incidents?${queryString}` : '/incidents';

  const response = await apiClient.get<ApiResponse<Incident[]>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch incidents');
  }
  return response.data.data ?? [];
};

export const getIncident = async (id: string): Promise<Incident> => {
  const response = await apiClient.get<ApiResponse<Incident>>(`/incidents/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch incident details');
  }
  return response.data.data as Incident;
};

export const createIncident = async (data: CreateIncidentDto): Promise<Incident> => {
  const response = await apiClient.post<ApiResponse<Incident>>('/incidents', data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to create incident');
  }
  return response.data.data as Incident;
};

export const updateIncident = async (id: string, data: UpdateIncidentDto): Promise<Incident> => {
  const response = await apiClient.put<ApiResponse<Incident>>(`/incidents/${id}`, data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to update incident');
  }
  return response.data.data as Incident;
};

export const addComment = async (incidentId: string, content: string): Promise<IncidentComment> => {
  const response = await apiClient.post<ApiResponse<IncidentComment>>(`/incidents/${incidentId}/comments`, {
    content,
  });
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to add comment');
  }
  return response.data.data as IncidentComment;
};

export const getAgents = async (): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>('/incidents/agents');
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch agents');
  }
  return response.data.data ?? [];
};
