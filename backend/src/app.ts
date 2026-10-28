import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import mealRoutes from './modules/meals/meal.routes';
import subscriptionRoutes from './modules/subscriptions/subscription.routes';
import orderRoutes from './modules/orders/order.routes';
import aiRoutes from './modules/ai/ai.routes';
import { startOrderGeneratorJob } from './jobs/orderGenerator';
import { logger } from './utils/logger';
import { env } from './config/env';
import cookieParser from 'cookie-parser';

const app = express();
app.set('trust proxy', 1);

// ── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/meals', mealRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/ai', aiRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  startOrderGeneratorJob();
});

export default app;
