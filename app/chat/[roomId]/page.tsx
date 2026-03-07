'use client';

import { use } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);

  return <ChatWindow roomId={roomId} />;
}
