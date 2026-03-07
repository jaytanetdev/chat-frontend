'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import Spinner from '@/components/ui/Spinner';
import { useMessages } from '@/hooks/useMessages';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/stores/auth.store';
import { ChatSenderType } from '@/types/api';
import { ChevronDown } from 'lucide-react';

interface ChatWindowProps {
  roomId: string;
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const userId = useAuthStore((s) => s.userId);
  const { joinRoom, leaveRoom, markRead } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(true);
  const lastMessageCountRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const {
    data,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    isLoading,
  } = useMessages(roomId);

  useEffect(() => {
    joinRoom(roomId);
    return () => { leaveRoom(roomId); };
  }, [roomId, joinRoom, leaveRoom]);

  const allMessages = useMemo(() => {
    if (!data) return [];
    // Reverse pages and items to show oldest first, newest last
    return data.pages.flatMap((page) => page.items).reverse();
  }, [data]);

  // Track if user is near bottom (should auto-scroll on new messages)
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    // Consider "near bottom" if within 100px of the bottom
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    isNearBottomRef.current = isNearBottom;
    setShowScrollButton(!isNearBottom);
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isNearBottomRef.current = true;
      setShowScrollButton(false);
    }
  }, []);

  // Track message count changes and scroll behavior
  useEffect(() => {
    const currentCount = allMessages.length;
    const prevCount = lastMessageCountRef.current;

    // Check if new messages were added (not when loading old ones)
    if (currentCount > prevCount && !isFetchingPreviousPage) {
      // Only auto-scroll if user was already near bottom
      if (isNearBottomRef.current) {
        shouldScrollToBottomRef.current = true;
      }
    }
    lastMessageCountRef.current = currentCount;
  }, [allMessages.length, isFetchingPreviousPage]);

  // Mark unread messages as read
  useEffect(() => {
    if (!allMessages.length || !userId) return;
    const unreadIds = allMessages
      .filter((m) => !m.is_read && m.sender_type === ChatSenderType.CUSTOMER)
      .map((m) => m.chat_id);
    if (unreadIds.length > 0) {
      markRead(roomId, unreadIds);
    }
  }, [allMessages, roomId, userId, markRead]);

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (scrollRef.current && shouldScrollToBottomRef.current && !isFetchingPreviousPage) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      shouldScrollToBottomRef.current = false;
    }
  }, [allMessages.length, isFetchingPreviousPage]);

  // Infinite scroll: observer on top sentinel to load older messages
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasPreviousPage && !isFetchingPreviousPage) {
        const container = scrollRef.current;
        const prevScrollHeight = container?.scrollHeight ?? 0;
        const prevScrollTop = container?.scrollTop ?? 0;

        fetchPreviousPage().then(() => {
          requestAnimationFrame(() => {
            // Maintain scroll position after loading older messages
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
            }
          });
        });
      }
    },
    [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage],
  );

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" label="กำลังโหลดข้อความ..." />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-gray-50">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        onScroll={handleScroll}
      >
        {/* Top sentinel for infinite scroll (load older messages) */}
        <div ref={topSentinelRef} className="h-1" />
        {isFetchingPreviousPage && (
          <div className="flex justify-center py-2">
            <Spinner size="sm" label="โหลดข้อความเก่า..." />
          </div>
        )}
        <div className="flex flex-col gap-2">
          {allMessages.map((chat) => (
            <ChatBubble
              key={chat.chat_id}
              chat={chat}
              isCurrentUser={
                chat.sender_type === ChatSenderType.ADMIN &&
                chat.sender_id === userId
              }
            />
          ))}
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary-500 px-4 py-2 text-white shadow-lg transition-all hover:bg-primary-600"
        >
          <div className="flex items-center gap-1">
            <ChevronDown className="h-4 w-4" />
            <span className="text-sm">ไปที่ข้อความล่าสุด</span>
          </div>
        </button>
      )}

      <TypingIndicator roomId={roomId} />
      <ChatInput roomId={roomId} />
    </div>
  );
}
