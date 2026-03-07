'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/types/api';

interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  role: UserRole | null;
  activeShopId: string | null;

  setAuth: (data: {
    token: string;
    userId: string;
    username: string;
    role: UserRole;
  }) => void;
  setActiveShopId: (shopId: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      username: null,
      role: null,
      activeShopId: null,

      setAuth: (data) =>
        set({
          token: data.token,
          userId: data.userId,
          username: data.username,
          role: data.role,
        }),

      setActiveShopId: (shopId) => set({ activeShopId: shopId }),

      logout: () =>
        set({
          token: null,
          userId: null,
          username: null,
          role: null,
          activeShopId: null,
        }),

      isAuthenticated: () => !!get().token,
    }),
    { name: 'auth-storage' },
  ),
);
