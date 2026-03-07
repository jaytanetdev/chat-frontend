import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'กรุณาพิมพ์ข้อความ'),
});

export type SendMessageFormData = z.infer<typeof sendMessageSchema>;
