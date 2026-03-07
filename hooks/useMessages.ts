'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ChatListResponse } from '@/types/api';

const PAGE_SIZE = 20;

export function useMessages(roomId: string | null) {
  return useInfiniteQuery<ChatListResponse>({
    queryKey: ['messages', roomId],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = { limit: PAGE_SIZE };
      if (pageParam) params.cursor = pageParam as string;
      const res = await api.get<ChatListResponse>(
        `/chats/room/${roomId}/detailed`,
        { params },
      );
      return res.data;
    },
    initialPageParam: null as string | null,
    // Load older messages when scrolling up
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.next_cursor : undefined,
    enabled: !!roomId,
  });
}
