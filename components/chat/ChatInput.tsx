'use client';

import { useRef, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { sendMessageSchema, type SendMessageFormData } from '@/schemas/chat.schema';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/cn';
import { useQueryClient } from '@tanstack/react-query';
import { ChatSenderType, ChatListResponse } from '@/types/api';
import api from '@/lib/axios';

interface ChatInputProps {
  roomId: string;
}

export default function ChatInput({ roomId }: ChatInputProps) {
  const { emitTyping, markRead } = useSocket();
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  const { register, handleSubmit, reset, formState: { isValid } } = useForm<SendMessageFormData>({
    resolver: zodResolver(sendMessageSchema),
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    async (data: SendMessageFormData) => {
      if (isSending) return;
      
      setIsSending(true);
      emitTyping(roomId, false);
      
      try {
        // Send message via REST API (which will also send to LINE platform)
        await api.post('/chats/send', {
          room_id: roomId,
          message: data.message,
          message_type: 'TEXT',
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['messages', roomId] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        
        reset();
      } catch (error) {
        console.error('Failed to send message:', error);
        // Optionally show error message to user
      } finally {
        setIsSending(false);
      }
    },
    [roomId, reset, emitTyping, queryClient, isSending],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const handleInput = () => {
    emitTyping(roomId, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitTyping(roomId, false);
    }, 2000);
  };

  // Mark messages as read when clicking/holding on input field
  const handleInputFocus = useCallback(() => {
    const messagesData = queryClient.getQueryData<{ pages: ChatListResponse[] }>(['messages', roomId]);
    if (messagesData && messagesData.pages) {
      const unreadIds = messagesData.pages
        .flatMap((page) => page.items)
        .filter((m) => !m.is_read && m.sender_type === ChatSenderType.CUSTOMER)
        .map((m) => m.chat_id);
      if (unreadIds.length > 0) {
        markRead(roomId, unreadIds);
      }
    }
  }, [roomId, markRead, queryClient]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-end gap-2 border-t border-gray-200 bg-white px-2 py-2 sm:px-4 sm:py-3"
    >
      <textarea
        {...register('message')}
        rows={1}
        placeholder="พิมพ์ข้อความ..."
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onFocus={handleInputFocus}
        onMouseDown={handleInputFocus}
        onPointerDown={handleInputFocus}
        className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm sm:px-4 sm:py-2.5 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <button
        type="submit"
        disabled={!isValid || isSending}
        className={cn(
          'shrink-0 rounded-xl p-2.5 transition-colors',
          isValid && !isSending
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed',
        )}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
}
