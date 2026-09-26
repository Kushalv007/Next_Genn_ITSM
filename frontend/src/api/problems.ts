import apiClient from './client';
import type {
  ApiResponse,
  Problem,
  CreateProblemDto,
  UpdateProblemDto,
  Incident,
} from '@/types';

export interface ProblemQueryParams {
  status?: string;
  search?: string;
  ownerId?: string;
}

export const getProblems = async (params: ProblemQueryParams = {}): Promise<Problem[]> => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.ownerId) query.append('ownerId', params.ownerId);

  const queryString = query.toString();
  const url = queryString ? `/problems?${queryString}` : '/problems';

  const response = await apiClient.get<ApiResponse<Problem[]>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch problems');
  }
  return response.data.data ?? [];
};

export const getProblem = async (id: string): Promise<Problem> => {
  const response = await apiClient.get<ApiResponse<Problem>>(`/problems/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch problem details');
  }
  return response.data.data as Problem;
};

export const createProblem = async (data: CreateProblemDto): Promise<Problem> => {
  const response = await apiClient.post<ApiResponse<Problem>>('/problems', data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to create problem');
  }
  return response.data.data as Problem;
};

export const updateProblem = async (id: string, data: UpdateProblemDto): Promise<Problem> => {
  const response = await apiClient.put<ApiResponse<Problem>>(`/problems/${id}`, data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to update problem');
  }
  return response.data.data as Problem;
};

export const linkIncidentToProblem = async (problemId: string, incidentId: string): Promise<Incident> => {
  const response = await apiClient.post<ApiResponse<Incident>>(`/problems/${problemId}/link-incident`, {
    incidentId,
  });
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to link incident');
  }
  return response.data.data as Incident;
};

export const unlinkIncidentFromProblem = async (problemId: string, incidentId: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<unknown>>(`/problems/${problemId}/unlink-incident`, {
    incidentId,
  });
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to unlink incident');
  }
};
