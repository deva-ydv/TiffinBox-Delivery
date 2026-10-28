import { z } from 'zod';
import { DeliveryDay } from '@prisma/client';

export const createSubscriptionSchema = z.object({
  mealPlanId: z.string().uuid('Invalid meal plan ID'),
  startDate: z.string().datetime('Invalid date format'),
  endDate: z.string().datetime().optional(),
  deliveryDays: z.array(z.nativeEnum(DeliveryDay)).min(1, 'Select at least one delivery day'),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
