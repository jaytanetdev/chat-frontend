'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import type { LoginResponse } from '@/types/api';
import type { LoginFormData } from '@/schemas/auth.schema';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await api.post<LoginResponse>('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth({
        token: data.access_token,
        userId: data.user_id,
        username: data.username,
        role: data.role,
      });
      router.push('/chat');
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return () => {
    disconnectSocket();
    logout();
    router.push('/login');
  };
}
