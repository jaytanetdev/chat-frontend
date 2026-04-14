'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import type { Chat, Room, ChatListResponse } from '@/types/api';
import type { Socket } from 'socket.io-client';

const queryClientRef: { current: QueryClient | null } = { current: null };

function handleNewMessage(chat: Chat) {
  const qc = queryClientRef.current;
  if (!qc) return;

  const activeRoomId = useChatStore.getState().activeRoomId;
  const isActiveRoom = chat.room_id === activeRoomId;

  qc.setQueryData(
    ['messages', chat.room_id],
    (oldData: { pages: ChatListResponse[]; pageParams: unknown[] } | undefined) => {
      if (!oldData) return oldData;

      const messageExists = oldData.pages.some((page) =>
        page.items.some((item) => item.chat_id === chat.chat_id),
      );
      if (messageExists) return oldData;

      const pages = [...oldData.pages];
      const firstPage = pages[0];

      if (firstPage) {
        pages[0] = { ...firstPage, items: [...firstPage.items, chat] };
      } else {
        pages.push({ items: [chat], next_cursor: null, hasMore: false });
      }

      return { ...oldData, pages };
    },
  );

  qc.setQueryData(['rooms'], (oldRooms: Room[] | undefined) => {
    if (!oldRooms) return oldRooms;
    const updated = oldRooms.map((r) =>
      r.room_id === chat.room_id
        ? {
            ...r,
            last_message_at: chat.create_at,
            last_message_text: chat.message || r.last_message_text,
            ...(isActiveRoom ? { unread_count: 0 } : {}),
          }
        : r,
    );
    return updated.sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });
  });

  qc.invalidateQueries({ queryKey: ['rooms'] });
}

function handleRoomUpdated(data: { room_id: string; unread_count?: number; last_message_at?: string; last_message_text?: string }) {
  const qc = queryClientRef.current;
  if (!qc) return;

  qc.setQueryData(['rooms'], (oldRooms: Room[] | undefined) => {
    if (!oldRooms) return oldRooms;

    const roomExists = oldRooms.some((r) => r.room_id === data.room_id);
    if (!roomExists) {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      return oldRooms;
    }

    const updated = oldRooms.map((room) =>
      room.room_id === data.room_id
        ? {
            ...room,
            unread_count: data.unread_count ?? room.unread_count,
            last_message_at: data.last_message_at ?? room.last_message_at,
            last_message_text: data.last_message_text ?? room.last_message_text,
          }
        : room,
    );

    return updated.sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });
  });
}

function handleTyping(data: { room_id: string; user_id: string; username: string; is_typing: boolean }) {
  const store = useChatStore.getState();
  if (data.is_typing) {
    store.addTypingUser(data.room_id, { user_id: data.user_id, username: data.username });
  } else {
    store.removeTypingUser(data.room_id, data.user_id);
  }
}

function handleMessagesRead(data: { room_id: string }) {
  queryClientRef.current?.invalidateQueries({ queryKey: ['messages', data.room_id] });
}

function registerListeners(socket: Socket) {
  socket.off('new_message').on('new_message', handleNewMessage);
  socket.off('room_updated').on('room_updated', handleRoomUpdated);
  socket.off('typing').on('typing', handleTyping);
  socket.off('messages_read').on('messages_read', handleMessagesRead);
}

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;

    registerListeners(socket);

    socket.on('connect', () => {
      registerListeners(socket);
    });
  }, [token]);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join_room', { room_id: roomId });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leave_room', { room_id: roomId });
  }, []);

  const sendMessage = useCallback(
    (roomId: string, message: string, metadata?: Record<string, unknown>) => {
      socketRef.current?.emit('send_message', {
        room_id: roomId,
        message,
        metadata,
      });
    },
    [],
  );

  const emitTyping = useCallback((roomId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { room_id: roomId, is_typing: isTyping });
  }, []);

  const markRead = useCallback((roomId: string, chatIds: string[]) => {
    socketRef.current?.emit('mark_read', { room_id: roomId, chat_ids: chatIds });
  }, []);

  return {
    joinRoom,
    leaveRoom,
    sendMessage,
    emitTyping,
    markRead,
    disconnect: disconnectSocket,
  };
}
