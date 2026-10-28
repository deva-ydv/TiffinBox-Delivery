import type { AxiosResponse } from 'axios';
import { api } from '../lib/api';
import type {
  ApiEnvelope, AuthPayload, ChatTurn, DeliveryDay, MealPlan, Order, OrderStatus,
  PlanSuggestion, Recommendation, Subscription, SubscriptionStatus, User,
} from '../lib/types';

const unwrap = <T>(request: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> =>
  request.then((res) => res.data.data);

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export const authApi = {
  login: (body: { email: string; password: string }) => unwrap<AuthPayload>(api.post('/auth/login', body)),
  register: (body: RegisterInput) => unwrap<AuthPayload>(api.post('/auth/register', body)),
  logout: () => unwrap<null>(api.post('/auth/logout')),
  profile: () => unwrap<User>(api.get('/auth/profile')),
  updateProfile: (body: { name?: string; phone?: string; address?: string }) =>
    unwrap<User>(api.patch('/auth/profile', body)),
};

export interface MealInput {
  name: string;
  description: string;
  pricePerDay: number;
  imageUrl?: string;
}

export const mealsApi = {
  list: () => unwrap<MealPlan[]>(api.get('/meals')),
  get: (id: string) => unwrap<MealPlan>(api.get(`/meals/${id}`)),
  create: (body: MealInput) => unwrap<MealPlan>(api.post('/meals', body)),
  update: (id: string, body: Partial<MealInput>) => unwrap<MealPlan>(api.patch(`/meals/${id}`, body)),
  remove: (id: string) => unwrap<null>(api.delete(`/meals/${id}`)),
};

export interface SubscribeInput {
  mealPlanId: string;
  startDate: string;
  endDate?: string;
  deliveryDays: DeliveryDay[];
}

export const subscriptionsApi = {
  create: (body: SubscribeInput) => unwrap<Subscription>(api.post('/subscriptions', body)),
  mine: () => unwrap<Subscription[]>(api.get('/subscriptions/my')),
  pause: (id: string) => unwrap<Subscription>(api.patch(`/subscriptions/${id}/pause`)),
  resume: (id: string) => unwrap<Subscription>(api.patch(`/subscriptions/${id}/resume`)),
  cancel: (id: string) => unwrap<Subscription>(api.patch(`/subscriptions/${id}/cancel`)),
  all: (status?: SubscriptionStatus) =>
    unwrap<Subscription[]>(api.get('/subscriptions', { params: status ? { status } : {} })),
};

export const ordersApi = {
  mine: (status?: OrderStatus) => unwrap<Order[]>(api.get('/orders/my', { params: status ? { status } : {} })),
  all: (filters: { status?: OrderStatus; date?: string }) =>
    unwrap<Order[]>(api.get('/orders', { params: filters })),
  updateStatus: (id: string, status: OrderStatus) =>
    unwrap<Order>(api.patch(`/orders/${id}/status`, { status })),
};

export const aiApi = {
  recommendations: () => unwrap<Recommendation[]>(api.get('/ai/recommendations')),
  chat: (message: string, history: ChatTurn[]) =>
    unwrap<{ reply: string }>(api.post('/ai/chat', { message, history })),
  suggestPlan: (body: { preference: string; budget: number; daysPerWeek: number }) =>
    unwrap<PlanSuggestion>(api.post('/ai/suggest-plan', body)),
};
