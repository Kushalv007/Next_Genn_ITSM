import apiClient from './client';
import type {
  ApiResponse,
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
} from '@/types';

export interface AssetQueryParams {
  type?: string;
  status?: string;
  search?: string;
  assignedToId?: string;
}

export const getAssets = async (params: AssetQueryParams = {}): Promise<Asset[]> => {
  const query = new URLSearchParams();
  if (params.type && params.type !== 'ALL') query.append('type', params.type);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.assignedToId) query.append('assignedToId', params.assignedToId);

  const queryString = query.toString();
  const url = queryString ? `/assets?${queryString}` : '/assets';

  const response = await apiClient.get<ApiResponse<Asset[]>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch assets');
  }
  return response.data.data ?? [];
};

export const getAsset = async (id: string): Promise<Asset> => {
  const response = await apiClient.get<ApiResponse<Asset>>(`/assets/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch asset details');
  }
  return response.data.data as Asset;
};

export const createAsset = async (data: CreateAssetDto): Promise<Asset> => {
  const response = await apiClient.post<ApiResponse<Asset>>('/assets', data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to register asset');
  }
  return response.data.data as Asset;
};

export const updateAsset = async (id: string, data: UpdateAssetDto): Promise<Asset> => {
  const response = await apiClient.put<ApiResponse<Asset>>(`/assets/${id}`, data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to update asset');
  }
  return response.data.data as Asset;
};
