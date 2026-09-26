import apiClient from './client';
import type {
  ApiResponse,
  ServiceCatalogItem,
  ServiceRequest,
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from '@/types';

export const getCatalogItems = async (category?: string): Promise<ServiceCatalogItem[]> => {
  const url = category && category !== 'ALL' ? `/service-catalog?category=${category}` : '/service-catalog';
  const response = await apiClient.get<ApiResponse<ServiceCatalogItem[]>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch catalog items');
  }
  return response.data.data ?? [];
};

export const getRequests = async (params: { status?: string; search?: string } = {}): Promise<ServiceRequest[]> => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());

  const queryString = query.toString();
  const url = queryString ? `/requests?${queryString}` : '/requests';

  const response = await apiClient.get<ApiResponse<ServiceRequest[]>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch service requests');
  }
  return response.data.data ?? [];
};

export const getRequest = async (id: string): Promise<ServiceRequest> => {
  const response = await apiClient.get<ApiResponse<ServiceRequest>>(`/requests/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch service request details');
  }
  return response.data.data as ServiceRequest;
};

export const createRequest = async (data: CreateServiceRequestDto): Promise<ServiceRequest> => {
  const response = await apiClient.post<ApiResponse<ServiceRequest>>('/requests', data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to submit service request');
  }
  return response.data.data as ServiceRequest;
};

export const updateRequest = async (id: string, data: UpdateServiceRequestDto): Promise<ServiceRequest> => {
  const response = await apiClient.put<ApiResponse<ServiceRequest>>(`/requests/${id}`, data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to update service request');
  }
  return response.data.data as ServiceRequest;
};

export const approveOrRejectRequest = async (
  id: string,
  approvalStatus: 'APPROVED' | 'REJECTED'
): Promise<ServiceRequest> => {
  const response = await apiClient.post<ApiResponse<ServiceRequest>>(`/requests/${id}/approval`, {
    approvalStatus,
  });
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to process request approval');
  }
  return response.data.data as ServiceRequest;
};

