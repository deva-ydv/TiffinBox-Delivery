import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { OrderStatus } from '@prisma/client';

export const getMyOrders = (userId: string, status?: OrderStatus) =>
  prisma.order.findMany({
    where: { userId, ...(status ? { status } : {}) },
    include: { mealPlan: true },
    orderBy: { deliveryDate: 'desc' },
  });

export const getOrderById = async (id: string, userId: string) => {
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { mealPlan: true, subscription: true },
  });
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new ApiError(404, 'Order not found');
  return prisma.order.update({ where: { id }, data: { status } });
};

export const getAllOrders = (status?: OrderStatus, date?: string) => {
  const where: any = {};
  if (status) where.status = status;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.deliveryDate = { gte: start, lte: end };
  }
  return prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      mealPlan: true,
    },
    orderBy: { deliveryDate: 'asc' },
  });
};
