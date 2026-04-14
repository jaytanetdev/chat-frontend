'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import RoomItem from './RoomItem';
import AdminProfile from '@/components/layout/AdminProfile';
import PlatformIcon from '@/components/ui/PlatformIcon';
import Spinner from '@/components/ui/Spinner';
import { useRooms, useShops } from '@/hooks/useRooms';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { PlatformType, type Room } from '@/types/api';
import { useState } from 'react';

interface SidebarProps {
  onClose?: () => void;
}

const PLATFORM_TABS: { key: string | null; label: string; type?: PlatformType; activeClass: string }[] = [
  { key: null, label: 'ทั้งหมด', activeClass: 'bg-gray-800 text-white' },
  { key: 'LINE', label: 'LINE', type: PlatformType.LINE, activeClass: 'bg-[#06C755] text-white' },
  { key: 'FACEBOOK', label: 'Facebook', type: PlatformType.FACEBOOK, activeClass: 'bg-[#1877F2] text-white' },
  { key: 'INSTAGRAM', label: 'IG', type: PlatformType.INSTAGRAM, activeClass: 'bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white' },
  { key: 'SHOPEE', label: 'Shopee', type: PlatformType.SHOPEE, activeClass: 'bg-[#EE4D2D] text-white' },
  { key: 'LAZADA', label: 'Lazada', type: PlatformType.LAZADA, activeClass: 'bg-[#0F1689] text-white' },
];

export default function Sidebar({ onClose }: SidebarProps = {}) {
  const router = useRouter();
  const params = useParams();
  const activeRoomId = params?.roomId as string | undefined;

  const { activeShopId, setActiveShopId } = useAuthStore();
  const { platformFilter, setPlatformFilter } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: shops } = useShops();
  const { data: rooms, isLoading } = useRooms();

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    let result = rooms;

    if (activeShopId) {
      result = result.filter((r) => r.platform?.shop_id === activeShopId);
    }

    if (platformFilter) {
      result = result.filter(
        (r) => r.platform?.platform_type === platformFilter,
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const name = r.customer_identity?.display_name ?? r.customer_identity?.external_user_id ?? '';
        return name.toLowerCase().includes(q);
      });
    }

    return [...result].sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });
  }, [rooms, activeShopId, platformFilter, searchQuery]);

  return (
    <div className="flex h-full w-72 flex-col border-r border-gray-200 bg-white sm:w-80">
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
            className="ml-auto rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none"
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

      {/* Platform filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-2 py-2 sm:px-3">
        {PLATFORM_TABS.map((tab) => {
          const isActive = platformFilter === tab.key;
          return (
            <button
              key={tab.key ?? 'all'}
              onClick={() => setPlatformFilter(tab.key)}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all sm:px-3',
                isActive
                  ? tab.activeClass
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {tab.type && <PlatformIcon type={tab.type} size="sm" className={isActive ? 'text-white' : ''} />}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.length > 4 ? tab.label.substring(0, 4) : tab.label}</span>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-gray-100 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <Spinner className="py-10" label="กำลังโหลด..." />
        ) : filteredRooms.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            ไม่พบห้องแชท
          </div>
        ) : (
          filteredRooms.map((room: Room) => (
            <RoomItem
              key={room.room_id}
              room={room}
              isActive={activeRoomId === room.room_id}
              onClick={() => {
                router.push(`/chat/${room.room_id}`);
                onClose?.();
              }}
            />
          ))
        )}
      </div>

      {/* Admin profile */}
      <AdminProfile />
    </div>
  );
}
