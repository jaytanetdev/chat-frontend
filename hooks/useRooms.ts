'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Room, Shop } from '@/types/api';

export function useRooms(platformId?: string | null) {
  return useQuery<Room[]>({
    queryKey: ['rooms', platformId ?? 'all'],
    queryFn: async () => {
      const params = platformId ? { platformId } : {};
      const res = await api.get<Room[]>('/rooms', { params });
      return res.data;
    },
  });
}

export function useShops() {
  return useQuery<Shop[]>({
    queryKey: ['shops'],
    queryFn: async () => {
      const res = await api.get<Shop[]>('/shops');
      return res.data;
    },
  });
}
