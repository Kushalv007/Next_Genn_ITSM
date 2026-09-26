import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>): Promise<unknown> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token as string}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(new Error('No refresh token'));
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        if (response.data.success && response.data.data) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        toast.error('Session expired. Please login again.');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
    const isNetworkOr404 = error.response?.status === 404 || !error.response;

    if (isDemoMode || isNetworkOr404) {
      const url = originalRequest.url || '';
      const method = (originalRequest.method || 'get').toLowerCase();

      const {
        demoCatalogItems,
        demoIncidents,
        demoRequests,
        demoKnowledge,
        demoProblems,
        demoChanges,
        demoAssets,
        demoNotifications,
      } = await import('./demoData');

      let fallbackData: any = null;

      if (url.includes('/service-catalog')) {
        fallbackData = demoCatalogItems;
      } else if (url.includes('/incidents')) {
        if (method === 'post') {
          const body = typeof originalRequest.data === 'string' ? JSON.parse(originalRequest.data) : originalRequest.data;
          fallbackData = {
            id: `inc-demo-${Date.now()}`,
            ticketNumber: `INC00000${demoIncidents.length + 1}`,
            shortDescription: body?.shortDescription || 'New Demo Incident',
            description: body?.description || '',
            category: body?.category || 'Hardware',
            priority: body?.priority || 'MEDIUM',
            status: 'NEW',
            slaBreached: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            comments: [],
            _count: { comments: 0 },
          };
        } else if (url.match(/\/incidents\/[^/]+$/)) {
          const id = url.split('/').pop();
          fallbackData = demoIncidents.find((i) => i.id === id || i.ticketNumber === id) || demoIncidents[0];
        } else {
          fallbackData = demoIncidents;
        }
      } else if (url.includes('/requests')) {
        if (method === 'post') {
          const body = typeof originalRequest.data === 'string' ? JSON.parse(originalRequest.data) : originalRequest.data;
          fallbackData = {
            id: `req-demo-${Date.now()}`,
            requestNumber: `REQ00000${demoRequests.length + 1}`,
            serviceCatalogItemId: body?.serviceCatalogItemId || 'cat-01',
            description: body?.description || '',
            status: 'SUBMITTED',
            approvalStatus: 'PENDING',
            catalogItem: demoCatalogItems[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        } else if (url.match(/\/requests\/[^/]+$/)) {
          const id = url.split('/').pop();
          fallbackData = demoRequests.find((r) => r.id === id || r.requestNumber === id) || demoRequests[0];
        } else {
          fallbackData = demoRequests;
        }
      } else if (url.includes('/knowledge')) {
        if (url.match(/\/knowledge\/[^/]+$/)) {
          const id = url.split('/').pop();
          fallbackData = demoKnowledge.find((k) => k.id === id) || demoKnowledge[0];
        } else {
          fallbackData = demoKnowledge;
        }
      } else if (url.includes('/problems')) {
        if (url.match(/\/problems\/[^/]+$/)) {
          const id = url.split('/').pop();
          fallbackData = demoProblems.find((p) => p.id === id || p.problemNumber === id) || demoProblems[0];
        } else {
          fallbackData = demoProblems;
        }
      } else if (url.includes('/changes')) {
        if (url.match(/\/changes\/[^/]+$/)) {
          const id = url.split('/').pop();
          fallbackData = demoChanges.find((c) => c.id === id || c.changeNumber === id) || demoChanges[0];
        } else {
          fallbackData = demoChanges;
        }
      } else if (url.includes('/assets')) {
        if (url.match(/\/assets\/[^/]+$/)) {
          const id = url.split('/').pop();
          fallbackData = demoAssets.find((a) => a.id === id || a.assetTag === id) || demoAssets[0];
        } else {
          fallbackData = demoAssets;
        }
      } else if (url.includes('/notifications')) {
        fallbackData = demoNotifications;
      }

      if (fallbackData !== null) {
        return {
          data: {
            success: true,
            data: fallbackData,
            message: 'Loaded successfully (Demo Mode)',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: originalRequest,
        };
      }
    }

    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message && !error.response) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
