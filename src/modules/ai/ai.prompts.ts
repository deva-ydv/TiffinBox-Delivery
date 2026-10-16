import { MealPlan, Order } from '@prisma/client';

export const buildRecommendationPrompt = (
  orders: (Order & { mealPlan: MealPlan })[],
  availablePlans: MealPlan[]
): string => `
You are a helpful assistant for a Mumbai tiffin delivery service.

The customer's recent order history (last 30 orders):
${JSON.stringify(orders.map(o => ({
  meal: o.mealPlan.name,
  date: o.deliveryDate,
  status: o.status,
})), null, 2)}

Available meal plans:
${JSON.stringify(availablePlans.map(p => ({
  id: p.id,
  name: p.name,
  description: p.description,
  pricePerDay: p.pricePerDay,
})), null, 2)}

Based on their order history, recommend the top 2 meal plans for this customer.
Respond ONLY with a JSON array — no extra text, no markdown:
[
  {
    "mealPlanId": "uuid",
    "mealPlanName": "name",
    "reason": "one sentence explanation based on their history"
  }
]
`;

export const buildChatSystemPrompt = (
  userName: string,
  availablePlans: MealPlan[]
): string => `
You are a friendly customer support assistant for TiffinBox, a Mumbai-based tiffin delivery service.
The customer's name is ${userName}.

Available meal plans:
${availablePlans.map(p => `- ${p.name}: Rs.${p.pricePerDay}/day — ${p.description}`).join('\n')}

Rules:
- Be helpful, concise, and warm. Use simple English.
- For order status, subscription details — use the provided functions to fetch real data.
- Never make up order details or prices.
- If you cannot help, politely ask them to contact support.
`;

export const buildSuggestionPrompt = (
  preference: string,
  budget: number,
  daysPerWeek: number,
  availablePlans: MealPlan[]
): string => `
You are a meal plan advisor for a Mumbai tiffin delivery service.

Customer preferences:
- Diet: ${preference}
- Budget per day: Rs.${budget}
- Days per week: ${daysPerWeek}

Available meal plans:
${JSON.stringify(availablePlans.map(p => ({
  id: p.id,
  name: p.name,
  description: p.description,
  pricePerDay: p.pricePerDay,
})), null, 2)}

Recommend the single best matching plan.
Respond ONLY with JSON — no extra text, no markdown:
{
  "mealPlanId": "uuid",
  "mealPlanName": "name",
  "explanation": "2 sentence explanation of why this fits their needs and budget"
}
`;
