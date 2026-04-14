'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import Spinner from '@/components/ui/Spinner';
import { useMessages } from '@/hooks/useMessages';
import { useRooms } from '@/hooks/useRooms';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { ChatSenderType, PlatformType } from '@/types/api';
import { getPlatformTheme } from '@/lib/platform-theme';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

interface ChatWindowProps {
  roomId: string;
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const userId = useAuthStore((s) => s.userId);
  const setActiveRoomId = useChatStore((s) => s.setActiveRoomId);
  const { data: rooms } = useRooms();
  const currentRoom = rooms?.find((r) => r.room_id === roomId);
  const platformType = currentRoom?.platform?.platform_type ?? PlatformType.LINE;
  const theme = getPlatformTheme(platformType);
  const { joinRoom, leaveRoom, markRead } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const isLoadingOlderRef = useRef(false);
  const didInitialScrollRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useMessages(roomId);

  useEffect(() => {
    setActiveRoomId(roomId);
    joinRoom(roomId);
    didInitialScrollRef.current = false;
    return () => {
      leaveRoom(roomId);
      setActiveRoomId(null);
    };
  }, [roomId, joinRoom, leaveRoom, setActiveRoomId]);

  const allMessages = useMemo(() => {
    if (!data) return [];
    const reversedPages = [...data.pages].reverse();
    return reversedPages.flatMap((page) => page.items);
  }, [data]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    isNearBottomRef.current = isNearBottom;
    setShowScrollButton(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    isNearBottomRef.current = true;
    setShowScrollButton(false);
  }, []);

  // Initial scroll to bottom (once per room)
  useEffect(() => {
    if (!isLoading && allMessages.length > 0 && !didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView();
        isNearBottomRef.current = true;
      });
    }
  }, [isLoading, allMessages.length]);

  // Auto-scroll when new messages arrive (like LINE app behavior)
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const count = allMessages.length;
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = count;

    // Only scroll for genuinely new messages, not for older-page loads
    if (count <= prevCount || prevCount === 0 || isLoadingOlderRef.current) return;

    if (isNearBottomRef.current) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      setShowScrollButton(true);
    }
  }, [allMessages.length]);

  // Mark unread
  useEffect(() => {
    if (!allMessages.length || !userId) return;
    const unreadIds = allMessages
      .filter((m) => !m.is_read && m.sender_type === ChatSenderType.CUSTOMER)
      .map((m) => m.chat_id);
    if (unreadIds.length > 0) {
      markRead(roomId, unreadIds);
    }
  }, [allMessages, roomId, userId, markRead]);

  // Infinite scroll — load older messages
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (!target.isIntersecting || !hasNextPage || isFetchingNextPage) return;

      const container = scrollRef.current;
      if (!container) return;

      isLoadingOlderRef.current = true;
      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;

      fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (container) {
              const heightDiff = container.scrollHeight - prevScrollHeight;
              container.scrollTop = prevScrollTop + heightDiff;
            }
            isLoadingOlderRef.current = false;
          });
        });
      }).catch(() => {
        isLoadingOlderRef.current = false;
      });
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: container,
      rootMargin: '100px',
      threshold: 0,
    });

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
    <div className="relative flex flex-1 flex-col overflow-hidden bg-gray-50">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-2 sm:px-4 sm:py-4"
        onScroll={handleScroll}
      >
        {/* Top sentinel */}
        <div ref={topSentinelRef} className="h-1 w-full" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Spinner size="sm" label="โหลดข้อความเก่า..." />
          </div>
        )}
        {!hasNextPage && allMessages.length > 0 && (
          <div className="flex justify-center py-2">
            <p className="text-xs text-gray-400">ไม่มีข้อความเก่าเพิ่มเติม</p>
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
              theme={theme}
            />
          ))}
        </div>
        <div ref={bottomRef} className="h-1" />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={cn(
            'absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 text-white shadow-lg transition-all sm:px-4 sm:py-2',
            theme.scrollBtn,
          )}
        >
          <div className="flex items-center gap-1">
            <ChevronDown className="h-4 w-4" />
            <span className="text-xs sm:text-sm">ไปที่ข้อความล่าสุด</span>
          </div>
        </button>
      )}

      <TypingIndicator roomId={roomId} />
      <ChatInput roomId={roomId} platformType={platformType} />
    </div>
  );
}
