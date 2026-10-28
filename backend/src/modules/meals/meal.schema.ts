import { z } from 'zod';

export const createMealSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  pricePerDay: z.number().positive(),
  imageUrl: z.string().url().optional(),
});

export const updateMealSchema = createMealSchema.partial();
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
