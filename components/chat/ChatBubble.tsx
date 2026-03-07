'use client';

import { cn } from '@/lib/cn';
import { ChatSenderType, type Chat } from '@/types/api';

interface ChatBubbleProps {
  chat: Chat;
  isCurrentUser: boolean;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatBubble({ chat, isCurrentUser }: ChatBubbleProps) {
  const isSystem = chat.sender_type === ChatSenderType.SYSTEM;

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
          {chat.message}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-2',
        isCurrentUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div
        className={cn(
          'max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2',
          isCurrentUser
            ? 'rounded-br-md bg-primary-500 text-white'
            : 'rounded-bl-md bg-gray-100 text-gray-900',
        )}
      >
        {!isCurrentUser && chat.sender_name && (
          <p className="mb-0.5 text-[11px] font-medium text-primary-600">
            {chat.sender_name}
          </p>
        )}

        {chat.message_type === 'IMAGE' && chat.metadata?.url ? (
          <img
            src={chat.metadata.url as string}
            alt="image"
            className="max-h-60 rounded-lg"
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap wrap-break-word">{chat.message}</p>
        )}

        <p
          className={cn(
            'mt-1 text-[10px]',
            isCurrentUser ? 'text-primary-200 text-right' : 'text-gray-400 text-right',
          )}
        >
          {formatTime(chat.create_at)}
        </p>
      </div>
    </div>
  );
}
