import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import apiClient from '@/services/api-client';
import { useAuthStore } from '@/store/auth';
import type { LoginRequest, RegisterRequest } from '@/types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { setUser, setToken, logout } = useAuthStore();

  const loginMutation = useMutation(
    (data: LoginRequest) => apiClient.login(data),
    {
      onSuccess: (response) => {
        const { accessToken, user } = response;
        setToken(accessToken);
        setUser(user);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/boards');
      },
      onError: (error: any) => {
        console.error('Login error:', error.response?.data);
      },
    },
  );

  const registerMutation = useMutation(
    (data: RegisterRequest) => apiClient.register(data),
    {
      onSuccess: (response) => {
        const { accessToken, user } = response;
        setToken(accessToken);
        setUser(user);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/boards');
      },
      onError: (error: any) => {
        console.error('Register error:', error.response?.data);
      },
    },
  );

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: handleLogout,
    isLoading: loginMutation.isLoading || registerMutation.isLoading,
    error: loginMutation.error || registerMutation.error,
  };
};
