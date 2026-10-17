import winston from 'winston';

const { combine, timestamp, errors, prettyPrint, json, colorize, simple } =
  winston.format;

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), simple())
  ),
  transports: [new winston.transports.Console()],
});
