import { z } from 'zod';

export const orderPaymentLocaleQuerySchema = z.object({
  locale: z.string().min(2).max(8).optional(),
  installment: z.coerce.number().int().min(1).max(12).optional(),
});
