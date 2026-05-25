import { authService } from '@/services/auth';
import { LoginResponse } from '@/types/auth.types';
import { useMutation, useQuery } from '@tanstack/react-query';

interface LoginData {
  emailOrPhone: string;
  password: string;
}

export function useLogin() {
  return useMutation<LoginResponse, Error, LoginData>({
    mutationFn: authService.login,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: authService.profile,
    enabled: !!localStorage.getItem('token'),
  });
}


