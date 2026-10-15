import cron from 'node-cron';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';
import { DeliveryDay } from '@prisma/client';

const dayMap: Record<number, DeliveryDay> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

export const generateDailyOrders = async () => {
  const today = new Date();
  const todayDay = dayMap[today.getDay()];
  const todayDate = new Date(today.setHours(0, 0, 0, 0));

  logger.info(`[OrderGenerator] Running for ${todayDay} — ${todayDate.toDateString()}`);

  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      deliveryDays: { has: todayDay },
      startDate: { lte: todayDate },
      OR: [{ endDate: null }, { endDate: { gte: todayDate } }],
    },
    include: { user: true, mealPlan: true },
  });

  logger.info(`[OrderGenerator] ${activeSubscriptions.length} active subscriptions found`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of activeSubscriptions) {
    try {
      await prisma.order.create({
        data: {
          userId: sub.userId,
          subscriptionId: sub.id,
          mealPlanId: sub.mealPlanId,
          deliveryDate: todayDate,
          deliveryAddress: sub.user.address ?? 'Address not set',
          price: sub.mealPlan.pricePerDay,
          status: 'PENDING',
        },
      });
      created++;
    } catch (err: any) {
      if (err.code === 'P2002') {
        // Unique constraint — order already exists for today (safe to skip)
        skipped++;
      } else {
        logger.error(`[OrderGenerator] Failed for subscription ${sub.id}`, err);
        failed++;
      }
    }
  }

  logger.info(
    `[OrderGenerator] Complete — Created: ${created} | Already existed: ${skipped} | Failed: ${failed}`
  );
};

// Runs every day at 6:00 AM IST
export const startOrderGeneratorJob = () => {
  cron.schedule('0 6 * * *', generateDailyOrders, { timezone: 'Asia/Kolkata' });
  logger.info('[OrderGenerator] Cron job scheduled — runs daily at 6:00 AM IST');
};
