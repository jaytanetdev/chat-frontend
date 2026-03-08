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
    // Pages are in order: [first page (newest), second page (older), ...]
    // Each page.items is already in chronological order (oldest first) from backend
    // We need to reverse pages to get oldest first, then flatten
    const reversedPages = [...data.pages].reverse();
    return reversedPages.flatMap((page) => page.items);
  }, [data]);

  // Debug: Log pagination state
  useEffect(() => {
    if (data) {
      console.log('📄 Messages state:', {
        pagesCount: data.pages.length,
        totalMessages: allMessages.length,
        hasPreviousPage,
        isFetchingPreviousPage,
        lastPageHasMore: data.pages[data.pages.length - 1]?.hasMore,
        lastPageNextCursor: data.pages[data.pages.length - 1]?.next_cursor,
      });
    }
  }, [data, hasPreviousPage, isFetchingPreviousPage, allMessages.length]);

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
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          shouldScrollToBottomRef.current = false;
        }
      });
    }
  }, [allMessages.length, isFetchingPreviousPage]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && scrollRef.current && allMessages.length > 0) {
      // Initial load - scroll to bottom
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          isNearBottomRef.current = true;
          shouldScrollToBottomRef.current = false;
        }
      });
    }
  }, [isLoading, allMessages.length]);

  // Infinite scroll: observer on top sentinel to load older messages
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      console.log('👁️ Observer triggered:', {
        isIntersecting: target.isIntersecting,
        hasPreviousPage,
        isFetchingPreviousPage,
        intersectionRatio: target.intersectionRatio,
      });

      if (target.isIntersecting && hasPreviousPage && !isFetchingPreviousPage) {
        console.log('🔄 Loading older messages...', { 
          hasPreviousPage, 
          isFetchingPreviousPage,
          currentPages: data?.pages.length,
        });
        const container = scrollRef.current;
        if (!container) return;

        // Save current scroll position
        const prevScrollHeight = container.scrollHeight;
        const prevScrollTop = container.scrollTop;

        // Fetch previous page (older messages)
        fetchPreviousPage().then(() => {
          console.log('✅ Older messages loaded');
          // Wait for DOM to update
          requestAnimationFrame(() => {
            if (container) {
              // Calculate new scroll position to maintain view
              const newScrollHeight = container.scrollHeight;
              const heightDiff = newScrollHeight - prevScrollHeight;
              container.scrollTop = prevScrollTop + heightDiff;
              console.log('📍 Scroll position maintained:', {
                prevScrollTop,
                newScrollTop: container.scrollTop,
                heightDiff,
              });
            }
          });
        }).catch((error) => {
          console.error('❌ Failed to load older messages:', error);
        });
      } else if (target.isIntersecting && !hasPreviousPage) {
        console.log('ℹ️ No more older messages to load');
      }
    },
    [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage, data?.pages.length],
  );

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) {
      console.log('⚠️ Cannot setup observer - missing sentinel or container');
      return;
    }

    console.log('🔍 Setting up IntersectionObserver', { 
      hasPreviousPage, 
      pagesCount: data?.pages.length,
      totalMessages: allMessages.length,
    });

    // Create observer with root as the scroll container
    const observer = new IntersectionObserver(handleObserver, {
      root: container,
      rootMargin: '50px', // Trigger when 50px away from top
      threshold: [0, 0.1, 0.5, 1], // Multiple thresholds for better detection
    });

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [handleObserver, hasPreviousPage, data?.pages.length, allMessages.length]);

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
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Top sentinel for infinite scroll (load older messages) */}
        <div 
          ref={topSentinelRef} 
          className="h-4 w-full"
          style={{ minHeight: '16px' }}
        />
        {isFetchingPreviousPage && (
          <div className="flex justify-center py-2">
            <Spinner size="sm" label="โหลดข้อความเก่า..." />
          </div>
        )}
        {!hasPreviousPage && allMessages.length > 0 && (
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
            />
          ))}
        </div>
        {/* Bottom sentinel for detecting when at bottom */}
        <div className="h-1" />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary-500 px-3 py-1.5 text-white shadow-lg transition-all hover:bg-primary-600 sm:px-4 sm:py-2"
        >
          <div className="flex items-center gap-1">
            <ChevronDown className="h-4 w-4" />
            <span className="text-xs sm:text-sm">ไปที่ข้อความล่าสุด</span>
          </div>
        </button>
      )}

      <TypingIndicator roomId={roomId} />
      <ChatInput roomId={roomId} />
    </div>
  );
}
