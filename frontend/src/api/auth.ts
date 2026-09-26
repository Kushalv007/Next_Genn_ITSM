import apiClient from './client';
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  LoginResponse,
  User,
} from '@/types';

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Login failed');
  }
  return response.data.data as LoginResponse;
};

export const register = async (data: RegisterRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register', {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
  });
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Registration failed');
  }
  return response.data.data as LoginResponse;
};

export const forgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
  const response = await apiClient.post<ApiResponse>('/auth/forgot-password', data);
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to send reset email');
  }
};

export const refreshToken = async (refreshTokenValue: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
    '/auth/refresh',
    { refreshToken: refreshTokenValue }
  );
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Token refresh failed');
  }
  return response.data.data as { accessToken: string; refreshToken: string };
};

export const getProfile = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  if (!response.data.success) {
    throw new Error(response.data.message ?? 'Failed to get profile');
  }
  return response.data.data as User;
};
