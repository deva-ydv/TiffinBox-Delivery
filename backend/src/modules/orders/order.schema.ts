import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});
