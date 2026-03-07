'use client';

import { useChatStore } from '@/stores/chat.store';

interface TypingIndicatorProps {
  roomId: string;
}

const EMPTY: never[] = [];

export default function TypingIndicator({ roomId }: TypingIndicatorProps) {
  const typingUsers = useChatStore((s) => s.typingUsers[roomId] ?? EMPTY);

  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.username).join(', ');

  return (
    <div className="px-4 py-1">
      <p className="text-xs text-gray-400 italic">
        {names} กำลังพิมพ์...
      </p>
    </div>
  );
}
