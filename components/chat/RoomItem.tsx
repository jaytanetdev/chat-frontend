'use client';

import { cn } from '@/lib/cn';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { getPlatformTheme } from '@/lib/platform-theme';
import type { Room } from '@/types/api';

interface RoomItemProps {
  room: Room;
  isActive: boolean;
  onClick: () => void;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'เมื่อสักครู่';
  if (mins < 60) return `${mins} นาที`;
  if (hours < 24) {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'เมื่อวาน';
  if (days < 7) return `${days} วันที่แล้ว`;
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export default function RoomItem({ room, isActive, onClick }: RoomItemProps) {
  const customer = room.customer_identity;
  const displayName = customer?.display_name ?? customer?.external_user_id ?? 'ไม่ทราบชื่อ';
  const platformType = room.platform?.platform_type;
  const theme = getPlatformTheme(platformType);
  const hasUnread = room.unread_count > 0;
  const lastMessage = room.last_message_text;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50',
        isActive && theme.activeRoom,
      )}
    >
      <div className="relative shrink-0">
        <Avatar
          src={customer?.avatar_url}
          name={displayName}
          size="md"
        />
        {platformType && (
          <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5">
            <PlatformIcon type={platformType} size="sm" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            'truncate text-sm',
            hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700',
          )}>
            {displayName}
          </p>
          <span className={cn(
            'shrink-0 text-[11px]',
            hasUnread ? cn('font-medium', theme.unreadTime) : 'text-gray-400',
          )}>
            {formatTime(room.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            'truncate text-xs',
            hasUnread ? 'font-medium text-gray-700' : 'text-gray-400',
          )}>
            {lastMessage || room.platform?.platform_name || platformType || ''}
          </p>
          <Badge count={room.unread_count} />
        </div>
      </div>
    </button>
  );
}
