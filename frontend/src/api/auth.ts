import { apiClient } from './client';
import type { TokenResponse } from '../types';

export const login = async (data: URLSearchParams) => {
  // Assuming OAuth2 form data for login
  const response = await apiClient.post<TokenResponse>('/api/v1/auth/login', data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const register = async (data: any) => {
  const response = await apiClient.post('/api/v1/auth/register', data);
  return response.data;
};
