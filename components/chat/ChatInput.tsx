'use client';

import { useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { sendMessageSchema, type SendMessageFormData } from '@/schemas/chat.schema';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/cn';

interface ChatInputProps {
  roomId: string;
}

export default function ChatInput({ roomId }: ChatInputProps) {
  const { sendMessage, emitTyping } = useSocket();
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const { register, handleSubmit, reset, formState: { isValid } } = useForm<SendMessageFormData>({
    resolver: zodResolver(sendMessageSchema),
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    (data: SendMessageFormData) => {
      sendMessage(roomId, data.message);
      reset();
      emitTyping(roomId, false);
    },
    [roomId, sendMessage, reset, emitTyping],
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-end gap-2 border-t border-gray-200 bg-white px-4 py-3"
    >
      <textarea
        {...register('message')}
        rows={1}
        placeholder="พิมพ์ข้อความ..."
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <button
        type="submit"
        disabled={!isValid}
        className={cn(
          'shrink-0 rounded-xl p-2.5 transition-colors',
          isValid
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed',
        )}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
}
