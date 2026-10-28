import type { DeliveryDay, OrderStatus, Role, SubscriptionStatus } from './types';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatPrice = (value: number) => inr.format(value);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const STATUS_LABEL: Record<OrderStatus | SubscriptionStatus, string> = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
};

export const ALL_DAYS: DeliveryDay[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
];
export const WEEKDAYS: DeliveryDay[] = ALL_DAYS.slice(0, 5);
export const DAY_SHORT: Record<DeliveryDay, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

/** Local-time YYYY-MM-DD, for <input type="date">. */
export const toDateInput = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDays = (d: Date, n: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

/** Local midnight of a YYYY-MM-DD string, as an ISO datetime the API accepts. */
export const dateInputToISO = (value: string) => new Date(`${value}T00:00:00`).toISOString();

export const isSameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const homeFor = (role: Role) => (role === 'ADMIN' ? '/admin' : '/app');

const JS_DAY_TO_ENUM: DeliveryDay[] = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
];

/**
 * Next delivery date on or after tomorrow for a subscription.
 * Orders are created each morning, so "next" starts from tomorrow.
 */
export function nextDeliveryDate(
  days: DeliveryDay[],
  startDate: string,
  endDate?: string | null,
): Date | null {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(0, 0, 0, 0);

  const cursor = addDays(new Date(), 1);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 366; i++) {
    const candidate = addDays(cursor, i);
    if (candidate < start) continue;
    if (end && candidate > end) return null;
    if (days.includes(JS_DAY_TO_ENUM[candidate.getDay()])) return candidate;
  }
  return null;
}
