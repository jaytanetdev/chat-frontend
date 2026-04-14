'use client';

import { cn } from '@/lib/cn';
import { ChatSenderType, ChatMessageType, type Chat } from '@/types/api';
import type { PlatformTheme } from '@/lib/platform-theme';
import { Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

interface ChatBubbleProps {
  chat: Chat;
  isCurrentUser: boolean;
  theme: PlatformTheme;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveMediaUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

function MediaContent({ chat }: { chat: Chat }) {
  const url = chat.metadata?.url as string | undefined;
  if (!url) {
    return <p className="text-sm whitespace-pre-wrap break-words">{chat.message || '[ไฟล์สื่อ]'}</p>;
  }

  const resolvedUrl = resolveMediaUrl(url);

  switch (chat.message_type) {
    case ChatMessageType.IMAGE:
      return (
        <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={resolvedUrl}
            alt="รูปภาพ"
            className="max-h-60 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.retried) {
                img.dataset.retried = '1';
                img.style.display = 'none';
                img.parentElement?.insertAdjacentHTML(
                  'beforeend',
                  '<span class="text-sm text-gray-400">[ไม่สามารถโหลดรูปภาพ]</span>',
                );
              }
            }}
          />
        </a>
      );

    case ChatMessageType.VIDEO:
      return (
        <video
          src={resolvedUrl}
          controls
          preload="metadata"
          className="max-h-60 max-w-full rounded-lg"
        >
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">ดูวิดีโอ</a>
        </video>
      );

    case ChatMessageType.AUDIO:
      return (
        <audio src={resolvedUrl} controls preload="metadata" className="max-w-full">
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">ฟังเสียง</a>
        </audio>
      );

    case ChatMessageType.STICKER: {
      const emoji = chat.metadata?.emoji as string | undefined;
      const metaPlatform = chat.metadata?.platformType as string | undefined;
      const stickerId = chat.metadata?.stickerId as string | undefined;

      if (emoji) {
        return <span className="text-7xl leading-none">{emoji}</span>;
      }

      if (metaPlatform === 'FACEBOOK' && stickerId) {
        const knownFbStickers: Record<string, string> = {
          '369239263222822': '\u{1F44D}',
          '369239343222814': '\u{1F44D}',
          '369239383222810': '\u{1F44D}',
        };
        const mappedEmoji = knownFbStickers[stickerId];
        if (mappedEmoji) {
          return <span className="text-7xl leading-none">{mappedEmoji}</span>;
        }
        return (
          <span className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
            [FB Sticker]
          </span>
        );
      }

      const stickerResourceType = chat.metadata?.stickerResourceType as string | undefined;
      const isAnimated = stickerResourceType === 'ANIMATION' || stickerResourceType === 'ANIMATION_SOUND';
      const stickerSrc = isAnimated
        ? resolvedUrl.replace('/android/sticker.png;compress=true', '/iPhone/sticker@2x.png')
        : resolvedUrl;
      return (
        <img
          src={stickerSrc}
          alt="สติกเกอร์"
          className="h-24 w-24"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.retried) {
              img.dataset.retried = '1';
              img.src = resolvedUrl.replace('/android/sticker.png;compress=true', '/iPhone/sticker@2x.png');
            }
          }}
        />
      );
    }

    case ChatMessageType.FILE: {
      const fileName = (chat.metadata?.fileName as string) || 'ไฟล์แนบ';
      return (
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm hover:bg-white transition-colors"
        >
          <Download className="h-4 w-4 shrink-0" />
          <span className="truncate">{fileName}</span>
        </a>
      );
    }

    default:
      return <p className="text-sm whitespace-pre-wrap break-words">{chat.message}</p>;
  }
}

export default function ChatBubble({ chat, isCurrentUser, theme }: ChatBubbleProps) {
  const isSystem = chat.sender_type === ChatSenderType.SYSTEM;
  const isMedia = chat.message_type !== ChatMessageType.TEXT;
  const isSticker = chat.message_type === ChatMessageType.STICKER;

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
          'max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] rounded-2xl px-3 py-2 sm:px-4',
          isCurrentUser
            ? cn('rounded-br-md', theme.bubble)
            : 'rounded-bl-md bg-gray-100 text-gray-900',
          isSticker && 'bg-transparent px-0 py-0',
        )}
      >
        {!isCurrentUser && chat.sender_name && (
          <p className={cn('mb-0.5 text-[11px] font-medium', theme.senderName)}>
            {chat.sender_name}
          </p>
        )}

        {isMedia ? (
          <MediaContent chat={chat} />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{chat.message}</p>
        )}

        <p
          className={cn(
            'mt-1 text-[10px] text-right',
            isCurrentUser ? theme.timeText : 'text-gray-400',
          )}
        >
          {formatTime(chat.create_at)}
        </p>
      </div>
    </div>
  );
}
