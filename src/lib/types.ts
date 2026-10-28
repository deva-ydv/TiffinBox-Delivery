export type Role = 'CUSTOMER' | 'ADMIN';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export type DeliveryDay =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
}

export interface MealPlan {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
  isAvailable: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  subscriptionId: string;
  mealPlanId: string;
  status: OrderStatus;
  deliveryDate: string;
  deliveryAddress: string;
  price: number;
  notes?: string | null;
  createdAt: string;
  mealPlan?: MealPlan;
  user?: { id: string; name: string; email: string; phone?: string | null };
}

export interface Subscription {
  id: string;
  userId: string;
  mealPlanId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string | null;
  deliveryDays: DeliveryDay[];
  createdAt: string;
  mealPlan: MealPlan;
  orders?: Order[];
  user?: { id: string; name: string; email: string };
}

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode?: number;
  data: T;
  message: string;
}

// export interface AuthPayload {
//   user: User;
//   accessToken: string;
//   refreshToken: string;
// }

export interface AuthPayload {
  user: User;
}
export interface Recommendation {
  mealPlanId: string;
  mealPlanName: string;
  reason: string;
}

export interface PlanSuggestion {
  mealPlanId: string;
  mealPlanName: string;
  explanation: string;
  mealPlan: MealPlan;
}

export interface ChatTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}
