import apiClient from './client';
import type {
  ApiResponse,
  KnowledgeArticle,
  CreateKnowledgeArticleDto,
  UpdateKnowledgeArticleDto,
} from '@/types';

export interface KnowledgeQueryParams {
  category?: string;
  search?: string;
  status?: string;
}

export const getKnowledgeArticles = async (
  params: KnowledgeQueryParams = {}
): Promise<KnowledgeArticle[]> => {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'ALL') query.append('category', params.category);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.status && params.status !== 'ALL') query.append('status', params.status);

  const queryString = query.toString();
  const url = queryString ? `/knowledge?${queryString}` : '/knowledge';

  const response = await apiClient.get<ApiResponse<KnowledgeArticle[]>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch knowledge articles');
  }
  return response.data.data ?? [];
};

export const getKnowledgeArticle = async (id: string): Promise<KnowledgeArticle> => {
  const response = await apiClient.get<ApiResponse<KnowledgeArticle>>(`/knowledge/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to fetch article details');
  }
  return response.data.data as KnowledgeArticle;
};

export const createKnowledgeArticle = async (
  data: CreateKnowledgeArticleDto
): Promise<KnowledgeArticle> => {
  const response = await apiClient.post<ApiResponse<KnowledgeArticle>>('/knowledge', data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to create article');
  }
  return response.data.data as KnowledgeArticle;
};

export const updateKnowledgeArticle = async (
  id: string,
  data: UpdateKnowledgeArticleDto
): Promise<KnowledgeArticle> => {
  const response = await apiClient.put<ApiResponse<KnowledgeArticle>>(`/knowledge/${id}`, data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to update article');
  }
  return response.data.data as KnowledgeArticle;
};

export const suggestArticles = async (query: string): Promise<KnowledgeArticle[]> => {
  if (!query || !query.trim()) return [];
  const response = await apiClient.get<ApiResponse<KnowledgeArticle[]>>(
    `/knowledge/suggest?query=${encodeURIComponent(query.trim())}`
  );
  if (!response.data.success) {
    return [];
  }
  return response.data.data ?? [];
};
