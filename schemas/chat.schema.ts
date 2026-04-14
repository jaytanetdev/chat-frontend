import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z.string(),
});

export type SendMessageFormData = z.infer<typeof sendMessageSchema>;
