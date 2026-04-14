'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, Image, Paperclip, X, Zap, RotateCcw, Settings, Plus, Trash2, Smile } from 'lucide-react';
import StickerPicker from './StickerPicker';
import { sendMessageSchema, type SendMessageFormData } from '@/schemas/chat.schema';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/cn';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { ChatSenderType, ChatListResponse } from '@/types/api';
import api from '@/lib/axios';
import axios from 'axios';

interface ChatInputProps {
  roomId: string;
}

interface QuickReplyItem {
  quick_reply_id: string;
  label: string;
  text: string;
  sort_order: number;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'error' | 'done';

const DEFAULT_REPLIES: QuickReplyItem[] = [
  { quick_reply_id: '_default_1', label: 'สวัสดี', text: 'สวัสดีครับ ยินดีให้บริการครับ มีอะไรให้ช่วยไหมครับ?', sort_order: 0 },
  { quick_reply_id: '_default_2', label: 'ขอบคุณ', text: 'ขอบคุณมากครับ หากมีข้อสงสัยเพิ่มเติมสามารถสอบถามได้เลยครับ', sort_order: 1 },
  { quick_reply_id: '_default_3', label: 'รอสักครู่', text: 'รบกวนรอสักครู่นะครับ กำลังตรวจสอบให้ครับ', sort_order: 2 },
];

export default function ChatInput({ roomId }: ChatInputProps) {
  const { emitTyping, markRead } = useSocket();
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showQrSettings, setShowQrSettings] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick reply CRUD
  const { data: quickReplies } = useQuery<QuickReplyItem[]>({
    queryKey: ['quick-replies'],
    queryFn: async () => {
      try {
        const res = await api.get<QuickReplyItem[]>('/quick-replies');
        return res.data.length > 0 ? res.data : DEFAULT_REPLIES;
      } catch {
        return DEFAULT_REPLIES;
      }
    },
  });

  const addQrMutation = useMutation({
    mutationFn: async (data: { label: string; text: string }) => {
      const res = await api.post<QuickReplyItem>('/quick-replies', data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quick-replies'] }),
  });

  const deleteQrMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quick-replies/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quick-replies'] }),
  });

  const [newLabel, setNewLabel] = useState('');
  const [newText, setNewText] = useState('');

  const { register, handleSubmit, reset, formState: { isValid } } = useForm<SendMessageFormData>({
    resolver: zodResolver(sendMessageSchema),
    mode: 'onChange',
    defaultValues: { message: '' },
  });

  const { ref: formRef, ...registerRest } = register('message');

  const clearFile = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPendingFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError(null);
  }, [filePreview]);

  const handleFileSelect = useCallback((file: File) => {
    setPendingFile(file);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError(null);
    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  }, []);

  const sendMediaFile = useCallback(async (file: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', roomId);
    formData.append('message_type', file.type.startsWith('image/') ? 'IMAGE' : 'FILE');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError(null);

    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
      let token = '';
      if (stored) {
        try { token = JSON.parse(stored)?.state?.token ?? ''; } catch { /* */ }
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/chats/send-media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 120000,
          signal: controller.signal,
          onUploadProgress: (e) => {
            if (e.total) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploadProgress(pct);
              if (pct >= 100) {
                setUploadStatus('processing');
              }
            }
          },
        },
      );

      setUploadStatus('done');
      abortControllerRef.current = null;
      return true;
    } catch (err: unknown) {
      abortControllerRef.current = null;
      if (axios.isCancel(err)) {
        setUploadStatus('idle');
        return false;
      }
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'อัพโหลดล้มเหลว');
      return false;
    }
  }, [roomId]);

  const onSubmit = useCallback(
    async (data: SendMessageFormData) => {
      if (isSending) return;
      setIsSending(true);
      emitTyping(roomId, false);

      try {
        if (pendingFile) {
          const ok = await sendMediaFile(pendingFile);
          if (ok) clearFile();
          else { setIsSending(false); return; }
        }

        if (data.message?.trim()) {
          await api.post('/chats/send', { room_id: roomId, message: data.message, message_type: 'TEXT' });
        }

        queryClient.invalidateQueries({ queryKey: ['messages', roomId] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        reset();
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    },
    [roomId, reset, emitTyping, queryClient, isSending, pendingFile, sendMediaFile, clearFile],
  );

  const retryUpload = useCallback(async () => {
    if (!pendingFile) return;
    setIsSending(true);
    const ok = await sendMediaFile(pendingFile);
    if (ok) {
      clearFile();
      queryClient.invalidateQueries({ queryKey: ['messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    }
    setIsSending(false);
  }, [pendingFile, sendMediaFile, clearFile, queryClient, roomId]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploadStatus('idle');
    setUploadProgress(0);
  }, []);

  const sendQuickReply = useCallback(async (text: string) => {
    if (isSending) return;
    setIsSending(true);
    setShowQuickReplies(false);
    try {
      await api.post('/chats/send', { room_id: roomId, message: text, message_type: 'TEXT' });
      queryClient.invalidateQueries({ queryKey: ['messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } catch (error) {
      console.error('Failed to send quick reply:', error);
    } finally {
      setIsSending(false);
    }
  }, [roomId, queryClient, isSending]);

  const sendSticker = useCallback(async (packageId: string, stickerId: string) => {
    if (isSending) return;
    setIsSending(true);
    setShowStickerPicker(false);
    try {
      await api.post('/chats/send-sticker', {
        room_id: roomId,
        package_id: packageId,
        sticker_id: stickerId,
      });
      queryClient.invalidateQueries({ queryKey: ['messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } catch (error) {
      console.error('Failed to send sticker:', error);
    } finally {
      setIsSending(false);
    }
  }, [roomId, queryClient, isSending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (pendingFile && !e.currentTarget.value.trim()) {
        onSubmit({ message: '' });
      } else {
        handleSubmit(onSubmit)();
      }
    }
    if (e.key === '/' && !e.currentTarget.value) {
      e.preventDefault();
      setShowQuickReplies((p) => !p);
    }
  };

  const handleInput = () => {
    emitTyping(roomId, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(roomId, false), 2000);
  };

  const handleInputFocus = useCallback(() => {
    const messagesData = queryClient.getQueryData<{ pages: ChatListResponse[] }>(['messages', roomId]);
    if (messagesData?.pages) {
      const unreadIds = messagesData.pages
        .flatMap((page) => page.items)
        .filter((m) => !m.is_read && m.sender_type === ChatSenderType.CUSTOMER)
        .map((m) => m.chat_id);
      if (unreadIds.length > 0) markRead(roomId, unreadIds);
    }
  }, [roomId, markRead, queryClient]);

  const canSend = isValid || !!pendingFile;
  const replies = quickReplies ?? DEFAULT_REPLIES;

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Quick replies panel */}
      {showQuickReplies && (
        <div className="border-b border-gray-100 px-2 py-2 sm:px-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">ข้อความด่วน (กด / เพื่อเปิด/ปิด)</p>
            <div className="flex gap-1">
              <button
                onClick={() => { setShowQrSettings((p) => !p); }}
                className={cn('rounded p-0.5', showQrSettings ? 'bg-primary-50 text-primary-500' : 'hover:bg-gray-100 text-gray-400')}
                title="ตั้งค่าข้อความด่วน"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setShowQuickReplies(false)} className="rounded p-0.5 hover:bg-gray-100">
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Quick reply buttons */}
          <div className="flex flex-wrap gap-1.5">
            {replies.map((qr) => (
              <div key={qr.quick_reply_id} className="group relative">
                <button
                  type="button"
                  onClick={() => sendQuickReply(qr.text)}
                  disabled={isSending}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-50"
                  title={qr.text}
                >
                  {qr.label}
                </button>
                {showQrSettings && !qr.quick_reply_id.startsWith('_default') && (
                  <button
                    onClick={() => deleteQrMutation.mutate(qr.quick_reply_id)}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add new quick reply form */}
          {showQrSettings && (
            <div className="mt-2 flex items-end gap-1.5 rounded-lg border border-dashed border-gray-300 p-2">
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  placeholder="ชื่อปุ่ม (เช่น สวัสดี)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-primary-400 focus:outline-none"
                  maxLength={20}
                />
                <input
                  type="text"
                  placeholder="ข้อความเต็ม..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-primary-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (newLabel.trim() && newText.trim()) {
                    addQrMutation.mutate({ label: newLabel.trim(), text: newText.trim() });
                    setNewLabel('');
                    setNewText('');
                  }
                }}
                disabled={!newLabel.trim() || !newText.trim() || addQrMutation.isPending}
                className="shrink-0 rounded bg-primary-500 p-1.5 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* File preview + upload progress */}
      {pendingFile && (
        <div className="border-b border-gray-100 px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            {filePreview ? (
              <img src={filePreview} alt="preview" className="h-16 w-16 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 items-center gap-2 rounded-lg bg-gray-50 px-3">
                <Paperclip className="h-4 w-4 text-gray-400" />
                <span className="max-w-[200px] truncate text-xs text-gray-600">{pendingFile.name}</span>
                <span className="text-[10px] text-gray-400">({(pendingFile.size / 1024).toFixed(0)} KB)</span>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-1">
              {/* Progress bar */}
              {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                <>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${uploadStatus === 'processing' ? 'animate-pulse bg-amber-500' : 'bg-primary-500'}`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    {uploadStatus === 'processing' ? (
                      <span className="text-[11px] font-medium text-amber-600">กำลังประมวลผล...</span>
                    ) : (
                      <span className="text-[11px] font-medium text-primary-600">{uploadProgress}%</span>
                    )}
                    <button
                      onClick={cancelUpload}
                      className="text-[11px] text-red-500 hover:text-red-600"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </>
              )}

              {/* Error state */}
              {uploadStatus === 'error' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-red-500">{uploadError || 'อัพโหลดล้มเหลว'}</span>
                  <button
                    onClick={retryUpload}
                    disabled={isSending}
                    className="flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-100"
                  >
                    <RotateCcw className="h-3 w-3" />
                    ลองใหม่
                  </button>
                </div>
              )}

              {uploadStatus === 'done' && (
                <span className="text-[11px] text-green-600 font-medium">อัพโหลดสำเร็จ</span>
              )}
            </div>

            {/* Close button */}
            {uploadStatus !== 'uploading' && uploadStatus !== 'processing' && (
              <button onClick={clearFile} className="shrink-0 rounded-full bg-gray-100 p-1 hover:bg-gray-200">
                <X className="h-3.5 w-3.5 text-gray-500" />
              </button>
            )}

            {/* Send button for file-only */}
            {uploadStatus === 'idle' && !isValid && (
              <button
                type="button"
                onClick={() => onSubmit({ message: '' })}
                disabled={isSending}
                className="ml-auto shrink-0 rounded-lg bg-primary-500 px-3 py-1.5 text-xs text-white hover:bg-primary-600 disabled:opacity-50"
              >
                ส่ง
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input row */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-end gap-1.5 px-2 py-2 sm:gap-2 sm:px-4 sm:py-3"
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }}
        />

        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="ส่งรูปภาพ"
          >
            <Image className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="ส่งไฟล์"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => { setShowQuickReplies((p) => !p); setShowStickerPicker(false); }}
            className={cn(
              'rounded-lg p-2 transition-colors',
              showQuickReplies ? 'bg-primary-50 text-primary-500' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
            )}
            title="ข้อความด่วน (กดปุ่ม /)"
          >
            <Zap className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => { setShowStickerPicker((p) => !p); setShowQuickReplies(false); }}
            className={cn(
              'rounded-lg p-2 transition-colors',
              showStickerPicker ? 'bg-primary-50 text-primary-500' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
            )}
            title="สติกเกอร์"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        <textarea
          {...registerRest}
          ref={(e) => {
            formRef(e);
            (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
          }}
          rows={1}
          placeholder="พิมพ์ข้อความ... (/ = ข้อความด่วน)"
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onFocus={handleInputFocus}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm sm:px-4 sm:py-2.5 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />

        <button
          type="submit"
          disabled={!canSend || isSending || uploadStatus === 'uploading'}
          className={cn(
            'shrink-0 rounded-xl p-2.5 transition-colors',
            canSend && !isSending && uploadStatus !== 'uploading'
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed',
          )}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {showStickerPicker && (
        <StickerPicker
          onSelect={sendSticker}
          onClose={() => setShowStickerPicker(false)}
        />
      )}
    </div>
  );
}
