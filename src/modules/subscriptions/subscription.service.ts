import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { CreateSubscriptionInput } from './subscription.schema';

export const subscribe = async (userId: string, data: CreateSubscriptionInput) => {
  const meal = await prisma.mealPlan.findUnique({ where: { id: data.mealPlanId } });
  if (!meal || !meal.isAvailable) throw new ApiError(404, 'Meal plan not available');

  const existing = await prisma.subscription.findFirst({
    where: { userId, mealPlanId: data.mealPlanId, status: 'ACTIVE' },
  });
  if (existing) throw new ApiError(409, 'Already subscribed to this meal plan');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.address) throw new ApiError(400, 'Please add a delivery address in your profile first');

  return prisma.subscription.create({
    data: {
      ...data,
      userId,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
    include: { mealPlan: true },
  });
};

export const getMySubscriptions = (userId: string) =>
  prisma.subscription.findMany({
    where: { userId },
    include: { mealPlan: true, orders: { take: 5, orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });

export const pauseSubscription = async (id: string, userId: string) => {
  const sub = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!sub) throw new ApiError(404, 'Subscription not found');
  if (sub.status !== 'ACTIVE') throw new ApiError(400, 'Only active subscriptions can be paused');
  return prisma.subscription.update({ where: { id }, data: { status: 'PAUSED' } });
};

export const resumeSubscription = async (id: string, userId: string) => {
  const sub = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!sub) throw new ApiError(404, 'Subscription not found');
  if (sub.status !== 'PAUSED') throw new ApiError(400, 'Only paused subscriptions can be resumed');
  return prisma.subscription.update({ where: { id }, data: { status: 'ACTIVE' } });
};

export const cancelSubscription = async (id: string, userId: string) => {
  const sub = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!sub) throw new ApiError(404, 'Subscription not found');
  if (sub.status === 'CANCELLED') throw new ApiError(400, 'Already cancelled');
  return prisma.subscription.update({ where: { id }, data: { status: 'CANCELLED' } });
};

export const getAllSubscriptions = (status?: string) =>
  prisma.subscription.findMany({
    where: status ? { status: status as any } : {},
    include: { user: { select: { id: true, name: true, email: true } }, mealPlan: true },
    orderBy: { createdAt: 'desc' },
  });
