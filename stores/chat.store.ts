'use client';

import { create } from 'zustand';

interface TypingUser {
  user_id: string;
  username: string;
}

interface ChatState {
  activeRoomId: string | null;
  typingUsers: Record<string, TypingUser[]>;
  platformFilter: string | null;

  setActiveRoomId: (roomId: string | null) => void;
  setPlatformFilter: (platformId: string | null) => void;
  addTypingUser: (roomId: string, user: TypingUser) => void;
  removeTypingUser: (roomId: string, userId: string) => void;
  clearTypingUsers: (roomId: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  activeRoomId: null,
  typingUsers: {},
  platformFilter: null,

  setActiveRoomId: (roomId) => set({ activeRoomId: roomId }),
  setPlatformFilter: (platformId) => set({ platformFilter: platformId }),

  addTypingUser: (roomId, user) =>
    set((state) => {
      const current = state.typingUsers[roomId] ?? [];
      if (current.some((u) => u.user_id === user.user_id)) return state;
      return {
        typingUsers: { ...state.typingUsers, [roomId]: [...current, user] },
      };
    }),

  removeTypingUser: (roomId, userId) =>
    set((state) => {
      const current = state.typingUsers[roomId] ?? [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: current.filter((u) => u.user_id !== userId),
        },
      };
    }),

  clearTypingUsers: (roomId) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [roomId]: [] },
    })),
}));
