'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Search, MessageSquare, X, MessageCircle,
  Facebook, Instagram, ShoppingBag, Package, Music,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import RoomItem from './RoomItem';
import AdminProfile from '@/components/layout/AdminProfile';
import Spinner from '@/components/ui/Spinner';
import { useInfiniteRooms, useUnreadSummary, useShops } from '@/hooks/useRooms';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { PlatformType, type Room } from '@/types/api';

interface SidebarProps {
  onClose?: () => void;
}

const PLATFORMS: {
  key: string | null;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  activeBg: string;
  badgeColor: string;
}[] = [
  {
    key: null, label: 'ทั้งหมด', shortLabel: 'ทั้งหมด',
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    color: 'text-gray-600', bg: 'bg-gray-50',
    activeBg: 'bg-gray-900 text-white',
    badgeColor: 'bg-red-500 text-white',
  },
  {
    key: 'LINE', label: 'LINE', shortLabel: 'LINE',
    icon: <MessageCircle className="h-3.5 w-3.5" />,
    color: 'text-[#06C755]', bg: 'bg-green-50',
    activeBg: 'bg-[#06C755] text-white',
    badgeColor: 'bg-[#06C755] text-white',
  },
  {
    key: 'FACEBOOK', label: 'Facebook', shortLabel: 'FB',
    icon: <Facebook className="h-3.5 w-3.5" />,
    color: 'text-[#1877F2]', bg: 'bg-blue-50',
    activeBg: 'bg-[#1877F2] text-white',
    badgeColor: 'bg-[#1877F2] text-white',
  },
  {
    key: 'INSTAGRAM', label: 'Instagram', shortLabel: 'IG',
    icon: <Instagram className="h-3.5 w-3.5" />,
    color: 'text-[#E1306C]', bg: 'bg-pink-50',
    activeBg: 'bg-[#E1306C] text-white',
    badgeColor: 'bg-[#E1306C] text-white',
  },
  {
    key: 'SHOPEE', label: 'Shopee', shortLabel: 'Shopee',
    icon: <ShoppingBag className="h-3.5 w-3.5" />,
    color: 'text-[#EE4D2D]', bg: 'bg-orange-50',
    activeBg: 'bg-[#EE4D2D] text-white',
    badgeColor: 'bg-[#EE4D2D] text-white',
  },
  {
    key: 'LAZADA', label: 'Lazada', shortLabel: 'Lazada',
    icon: <Package className="h-3.5 w-3.5" />,
    color: 'text-[#0F1689]', bg: 'bg-indigo-50',
    activeBg: 'bg-[#0F1689] text-white',
    badgeColor: 'bg-[#0F1689] text-white',
  },
  {
    key: 'TIKTOK', label: 'TikTok', shortLabel: 'TikTok',
    icon: <Music className="h-3.5 w-3.5" />,
    color: 'text-[#FE2C55]', bg: 'bg-rose-50',
    activeBg: 'bg-[#010101] text-white',
    badgeColor: 'bg-[#FE2C55] text-white',
  },
];

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Sidebar({ onClose }: SidebarProps = {}) {
  const router = useRouter();
  const params = useParams();
  const activeRoomId = params?.roomId as string | undefined;

  const { activeShopId, setActiveShopId } = useAuthStore();
  const { platformFilter, setPlatformFilter } = useChatStore();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 700);

  const { data: shops } = useShops();
  const { data: unreadData } = useUnreadSummary();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteRooms({
    platformType: platformFilter,
    search: debouncedSearch,
    limit: 20,
  });

  const rooms = useMemo(() => {
    if (!data) return [];
    const all = data.pages.flatMap((p) => p.items);
    if (activeShopId) {
      return all.filter((r) => r.platform?.shop_id === activeShopId);
    }
    return all;
  }, [data, activeShopId]);

  const listRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || isFetchingNextPage || !hasNextPage) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="flex h-full w-80 flex-col border-r border-gray-200 bg-white sm:w-[340px]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <MessageSquare className="h-5 w-5 text-primary-500" />
        <h1 className="text-lg font-bold text-gray-900">แชท</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {shops && shops.length > 1 && (
          <select
            value={activeShopId ?? ''}
            onChange={(e) => setActiveShopId(e.target.value || '')}
            className="ml-auto rounded-md border border-gray-300 px-2 py-1 text-base focus:border-primary-500 focus:outline-none sm:text-xs"
          >
            <option value="">ทุกร้าน</option>
            {shops.map((shop) => (
              <option key={shop.shop_id} value={shop.shop_id}>
                {shop.shop_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Platform filter with unread badges */}
      <div className="grid grid-cols-3 gap-1.5 border-b border-gray-100 px-3 py-2">
        {PLATFORMS.map((p) => {
          const isActive = platformFilter === p.key;
          const unread = p.key
            ? (unreadData?.byPlatform[p.key] ?? 0)
            : (unreadData?.total ?? 0);
          return (
            <button
              key={p.key ?? 'all'}
              onClick={() => setPlatformFilter(isActive && p.key !== null ? null : p.key)}
              className={cn(
                'flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-all',
                isActive ? p.activeBg : cn(p.bg, p.color, 'hover:opacity-80'),
              )}
            >
              {p.icon}
              <span>{p.shortLabel}</span>
              {unread > 0 && (
                <span className={cn(
                  'ml-0.5 min-w-[16px] rounded-full px-1 text-center text-[9px] font-bold leading-[16px]',
                  isActive ? 'bg-white/30 text-white' : p.badgeColor,
                )}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาลูกค้า..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg bg-gray-100 py-2 pl-9 pr-8 text-base placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Room list with infinite scroll */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2"
      >
        {isLoading ? (
          <Spinner className="py-10" label="กำลังโหลด..." />
        ) : rooms.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {debouncedSearch ? 'ไม่พบผลลัพธ์' : 'ไม่พบห้องแชท'}
          </div>
        ) : (
          <>
            {rooms.map((room: Room) => (
              <RoomItem
                key={room.room_id}
                room={room}
                isActive={activeRoomId === room.room_id}
                onClick={() => {
                  router.push(`/chat/${room.room_id}`);
                  onClose?.();
                }}
              />
            ))}
            {isFetchingNextPage && <Spinner className="py-3" label="" />}
            {!hasNextPage && rooms.length >= 20 && (
              <p className="py-3 text-center text-xs text-gray-300">แสดงทั้งหมดแล้ว</p>
            )}
          </>
        )}
      </div>

      {/* Admin profile */}
      <AdminProfile />
    </div>
  );
}
