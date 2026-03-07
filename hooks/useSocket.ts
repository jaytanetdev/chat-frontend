'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import type { Chat, Room, ChatListResponse } from '@/types/api';
import type { Socket } from 'socket.io-client';

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { addTypingUser, removeTypingUser } = useChatStore();

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('new_message', (chat: Chat) => {
      // Optimistically add new message to cache instead of invalidating
      queryClient.setQueryData(
        ['messages', chat.room_id],
        (oldData: { pages: ChatListResponse[] } | undefined) => {
          if (!oldData) return oldData;

          // Check if message already exists (duplicate check)
          const messageExists = oldData.pages.some((page) =>
            page.items.some((item) => item.chat_id === chat.chat_id),
          );
          if (messageExists) return oldData;

          // Add new message to the last page (newest messages)
          const pages = [...oldData.pages];
          const lastPage = pages[pages.length - 1];

          if (lastPage) {
            // Check if last page already has this message
            const existsInLastPage = lastPage.items.some((item) => item.chat_id === chat.chat_id);
            if (!existsInLastPage) {
              pages[pages.length - 1] = {
                ...lastPage,
                items: [...lastPage.items, chat],
              };
            }
          }

          return { ...oldData, pages };
        },
      );

      // Update room list in cache - move room to top only on new message
      queryClient.setQueryData(['rooms'], (oldRooms: Room[] | undefined) => {
        if (!oldRooms) return oldRooms;

        const roomIndex = oldRooms.findIndex((r) => r.room_id === chat.room_id);
        if (roomIndex === -1) return oldRooms;

        // Create new array with updated room at top
        const updatedRooms = [...oldRooms];
        const [room] = updatedRooms.splice(roomIndex, 1);

        // Update room's last message info
        const updatedRoom = {
          ...room,
          last_message_at: chat.create_at,
          unread_count: chat.direction === 'IN' ? (room.unread_count || 0) + 1 : room.unread_count,
        };

        return [updatedRoom, ...updatedRooms];
      });
    });

    socket.on('room_updated', (data: { room_id: string; unread_count?: number; last_message_at?: string }) => {
      // Update specific room in cache without reordering
      queryClient.setQueryData(['rooms'], (oldRooms: Room[] | undefined) => {
        if (!oldRooms) return oldRooms;

        return oldRooms.map((room) =>
          room.room_id === data.room_id
            ? { ...room, unread_count: data.unread_count ?? room.unread_count, last_message_at: data.last_message_at ?? room.last_message_at }
            : room,
        );
      });
    });

    socket.on(
      'typing',
      (data: {
        room_id: string;
        user_id: string;
        username: string;
        is_typing: boolean;
      }) => {
        if (data.is_typing) {
          addTypingUser(data.room_id, {
            user_id: data.user_id,
            username: data.username,
          });
        } else {
          removeTypingUser(data.room_id, data.user_id);
        }
      },
    );

    socket.on(
      'messages_read',
      (data: { room_id: string }) => {
        queryClient.invalidateQueries({
          queryKey: ['messages', data.room_id],
        });
      },
    );

    return () => {
      socket.off('new_message');
      socket.off('room_updated');
      socket.off('typing');
      socket.off('messages_read');
    };
  }, [token, queryClient, addTypingUser, removeTypingUser]);

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
