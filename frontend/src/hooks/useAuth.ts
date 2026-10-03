import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { login as loginApi, register as registerApi } from '../api/auth';
import { apiClient } from '../api/client';
import type { User } from '../types';

export const useAuth = () => {
  const { user, setAuth, clearAuth, isAuthenticated } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
    }
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      // Assuming register returns similar TokenResponse or just user
      if (data.access_token) {
        setAuth(data.user, data.access_token, data.refresh_token);
      }
    }
  });

  const logout = () => {
    clearAuth();
  };

  const checkAuthQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get<User>('/api/v1/auth/me');
      return res.data;
    },
    enabled: isAuthenticated(),
    retry: false
  });

  return {
    user,
    isAuthenticated: isAuthenticated(),
    isLoading: loginMutation.isPending || checkAuthQuery.isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
  };
};
