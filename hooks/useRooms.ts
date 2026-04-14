'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Room, Shop, PaginatedRooms } from '@/types/api';

export function useRooms(platformId?: string | null) {
  return useQuery<Room[]>({
    queryKey: ['rooms', platformId ?? 'all'],
    queryFn: async () => {
      const params = platformId ? { platformId } : {};
      const res = await api.get<Room[] | PaginatedRooms>('/rooms', { params });
      if (Array.isArray(res.data)) return res.data;
      return (res.data as PaginatedRooms).items;
    },
  });
}

export function useInfiniteRooms(params: {
  platformType?: string | null;
  search?: string;
  limit?: number;
}) {
  const limit = params.limit ?? 20;

  return useInfiniteQuery<PaginatedRooms>({
    queryKey: ['rooms-infinite', params.platformType ?? 'all', params.search ?? ''],
    queryFn: async ({ pageParam }) => {
      const query: Record<string, string | number> = {
        page: pageParam as number,
        limit,
      };
      if (params.platformType) query.platformType = params.platformType;
      if (params.search?.trim()) query.search = params.search.trim();

      const res = await api.get<PaginatedRooms>('/rooms', { params: query });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
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
