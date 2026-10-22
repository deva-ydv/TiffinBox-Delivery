// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { env } from '../../config/env';
// import { prisma } from '../../config/db';
// import { ApiError } from '../../utils/ApiError';
// import { logger } from '../../utils/logger';
// import {
//   buildRecommendationPrompt,
//   buildChatSystemPrompt,
//   buildSuggestionPrompt,
// } from './ai.prompts';

// const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// // ─── 1. Meal Recommendations ─────────────────────────────────────────────────

// export const getMealRecommendations = async (userId: string) => {
//   const [recentOrders, availablePlans] = await Promise.all([
//     prisma.order.findMany({
//       where: { userId },
//       take: 30,
//       orderBy: { createdAt: 'desc' },
//       include: { mealPlan: true },
//     }),
//     prisma.mealPlan.findMany({ where: { isAvailable: true } }),
//   ]);

//   if (recentOrders.length === 0) {
//     return availablePlans.map((p) => ({
//       mealPlanId: p.id,
//       mealPlanName: p.name,
//       reason: 'Popular choice among our customers',
//     }));
//   }

//   const prompt = buildRecommendationPrompt(recentOrders, availablePlans);
//   try {
//     const result = await model.generateContent(prompt);
//     const text = result.response.text().trim();
//     return JSON.parse(text);
//   } catch (err) {
//     logger.error('[AI] Recommendation failed', err);
//     throw new ApiError(500, 'Could not generate recommendations');
//   }
// };

// // ─── 2. AI Support Chatbot with Tool Calling ─────────────────────────────────

// const chatTools = [
//   {
//     name: 'get_my_orders',
//     description: "Get the customer's recent orders with status",
//     parameters: {
//       type: 'object',
//       properties: {
//         limit: { type: 'number', description: 'Number of orders to fetch (default 5)' },
//       },
//     },
//   },
//   {
//     name: 'get_my_subscriptions',
//     description: "Get the customer's active subscriptions",
//     parameters: { type: 'object', properties: {} },
//   },
//   {
//     name: 'get_meal_plans',
//     description: 'Get all available meal plans with prices',
//     parameters: { type: 'object', properties: {} },
//   },
// ];

// const executeTool = async (toolName: string, args: any, userId: string) => {
//   switch (toolName) {
//     case 'get_my_orders': {
//       const orders = await prisma.order.findMany({
//         where: { userId },
//         take: args.limit || 5,
//         orderBy: { deliveryDate: 'desc' },
//         include: { mealPlan: true },
//       });
//       return orders.map((o) => ({
//         id: o.id,
//         meal: o.mealPlan.name,
//         status: o.status,
//         deliveryDate: o.deliveryDate,
//         price: o.price,
//       }));
//     }
//     case 'get_my_subscriptions': {
//       const subs = await prisma.subscription.findMany({
//         where: { userId, status: 'ACTIVE' },
//         include: { mealPlan: true },
//       });
//       return subs.map((s) => ({
//         id: s.id,
//         plan: s.mealPlan.name,
//         status: s.status,
//         deliveryDays: s.deliveryDays,
//         startDate: s.startDate,
//       }));
//     }
//     case 'get_meal_plans':
//       return prisma.mealPlan.findMany({ where: { isAvailable: true } });
//     default:
//       return { error: 'Unknown tool' };
//   }
// };

// export const chat = async (
//   userId: string,
//   userMessage: string,
//   history: { role: 'user' | 'model'; parts: { text: string }[] }[]
// ) => {
//   const [user, availablePlans] = await Promise.all([
//     prisma.user.findUnique({ where: { id: userId } }),
//     prisma.mealPlan.findMany({ where: { isAvailable: true } }),
//   ]);

//   if (!user) throw new ApiError(404, 'User not found');

//   const systemPrompt = buildChatSystemPrompt(user.name, availablePlans);

//   const fullHistory = [
//     { role: 'user' as const, parts: [{ text: systemPrompt }] },
//     { role: 'model' as const, parts: [{ text: "Got it! I'm ready to help TiffinBox customers." }] },
//     ...history,
//   ];

//   const chatSession = model.startChat({
//     history: fullHistory,
//     tools: [{ functionDeclarations: chatTools }] as any,
//   });

//   const result = await chatSession.sendMessage(userMessage);
//   const response = result.response;

//   const functionCall = response.candidates?.[0]?.content?.parts?.find(
//     (p: any) => p.functionCall
//   )?.functionCall;

//   if (functionCall) {
//     logger.info(`[AI Chat] Tool called: ${functionCall.name}`);
//     const toolResult = await executeTool(functionCall.name, functionCall.args, userId);
//     const finalResult = await chatSession.sendMessage([
//       { functionResponse: { name: functionCall.name, response: { result: toolResult } } } as any,
//     ]);
//     return { reply: finalResult.response.text() };
//   }

//   return { reply: response.text() };
// };

// // ─── 3. Smart Plan Suggester ──────────────────────────────────────────────────

// export const suggestPlan = async (preference: string, budget: number, daysPerWeek: number) => {
//   const availablePlans = await prisma.mealPlan.findMany({ where: { isAvailable: true } });
//   if (availablePlans.length === 0) throw new ApiError(404, 'No meal plans available');

//   const prompt = buildSuggestionPrompt(preference, budget, daysPerWeek, availablePlans);
//   try {
//     const result = await model.generateContent(prompt);
//     const text = result.response.text().trim();
//     const suggestion = JSON.parse(text);
//     const plan = availablePlans.find((p) => p.id === suggestion.mealPlanId);
//     return { ...suggestion, mealPlan: plan || null };
//   } catch (err) {
//     logger.error('[AI] Suggestion failed', err);
//     throw new ApiError(500, 'Could not generate suggestion');
//   }
// };
// --------------------------------------------------------------------------------------------------------------------------
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../utils/logger';
import {
  buildRecommendationPrompt,
  buildChatSystemPrompt,
  buildSuggestionPrompt,
} from './ai.prompts';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// JSON mode: for endpoints that parse the reply with JSON.parse
const jsonModel = genAI.getGenerativeModel({
  model: env.GEMINI_MODEL,
  generationConfig: { responseMimeType: 'application/json' },
});

// Plain text mode: for the chatbot
const chatModel = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

// ─── 1. Meal Recommendations ─────────────────────────────────────────────────

export const getMealRecommendations = async (userId: string) => {
  const [recentOrders, availablePlans] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: { mealPlan: true },
    }),
    prisma.mealPlan.findMany({ where: { isAvailable: true } }),
  ]);

  if (recentOrders.length === 0) {
    return availablePlans.map((p) => ({
      mealPlanId: p.id,
      mealPlanName: p.name,
      reason: 'Popular choice among our customers',
    }));
  }

  const prompt = buildRecommendationPrompt(recentOrders, availablePlans);
  try {
    const result = await jsonModel.generateContent(prompt);
    const text = result.response.text().trim();
    return JSON.parse(text);
  } catch (err) {
    logger.error('[AI] Recommendation failed', err);
    throw new ApiError(500, 'Could not generate recommendations');
  }
};

// ─── 2. AI Support Chatbot with Tool Calling ─────────────────────────────────

const chatTools = [
  {
    name: 'get_my_orders',
    description: "Get the customer's recent orders with status",
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of orders to fetch (default 5)' },
      },
    },
  },
  {
    name: 'get_my_subscriptions',
    description: "Get the customer's active subscriptions",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_meal_plans',
    description: 'Get all available meal plans with prices',
    parameters: { type: 'object', properties: {} },
  },
];

const executeTool = async (toolName: string, args: any, userId: string) => {
  switch (toolName) {
    case 'get_my_orders': {
      const orders = await prisma.order.findMany({
        where: { userId },
        take: args.limit || 5,
        orderBy: { deliveryDate: 'desc' },
        include: { mealPlan: true },
      });
      return orders.map((o) => ({
        id: o.id,
        meal: o.mealPlan.name,
        status: o.status,
        deliveryDate: o.deliveryDate,
        price: o.price,
      }));
    }
    case 'get_my_subscriptions': {
      const subs = await prisma.subscription.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { mealPlan: true },
      });
      return subs.map((s) => ({
        id: s.id,
        plan: s.mealPlan.name,
        status: s.status,
        deliveryDays: s.deliveryDays,
        startDate: s.startDate,
      }));
    }
    case 'get_meal_plans':
      return prisma.mealPlan.findMany({ where: { isAvailable: true } });
    default:
      return { error: 'Unknown tool' };
  }
};

export const chat = async (
  userId: string,
  userMessage: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
) => {
  const [user, availablePlans] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.mealPlan.findMany({ where: { isAvailable: true } }),
  ]);

  if (!user) throw new ApiError(404, 'User not found');

  const systemPrompt = buildChatSystemPrompt(user.name, availablePlans);

  const fullHistory = [
    { role: 'user' as const, parts: [{ text: systemPrompt }] },
    { role: 'model' as const, parts: [{ text: "Got it! I'm ready to help TiffinBox customers." }] },
    ...history,
  ];

  const chatSession = chatModel.startChat({
    history: fullHistory,
    tools: [{ functionDeclarations: chatTools }] as any,
  });

  const result = await chatSession.sendMessage(userMessage);
  const response = result.response;

  const functionCall = response.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.functionCall
  )?.functionCall;

  if (functionCall) {
    logger.info(`[AI Chat] Tool called: ${functionCall.name}`);
    const toolResult = await executeTool(functionCall.name, functionCall.args, userId);
    const finalResult = await chatSession.sendMessage([
      { functionResponse: { name: functionCall.name, response: { result: toolResult } } } as any,
    ]);
    return { reply: finalResult.response.text() };
  }

  return { reply: response.text() };
};

// ─── 3. Smart Plan Suggester ──────────────────────────────────────────────────

export const suggestPlan = async (preference: string, budget: number, daysPerWeek: number) => {
  const availablePlans = await prisma.mealPlan.findMany({ where: { isAvailable: true } });
  if (availablePlans.length === 0) throw new ApiError(404, 'No meal plans available');

  const prompt = buildSuggestionPrompt(preference, budget, daysPerWeek, availablePlans);
  try {
    const result = await jsonModel.generateContent(prompt);
    const text = result.response.text().trim();
    const suggestion = JSON.parse(text);
    const plan = availablePlans.find((p) => p.id === suggestion.mealPlanId);
    return { ...suggestion, mealPlan: plan || null };
  } catch (err) {
    logger.error('[AI] Suggestion failed', err);
    throw new ApiError(500, 'Could not generate suggestion');
  }
};
// -------------------------------------------------------------------------------------------------------------------------------------------
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { env } from '../../config/env';
// import { prisma } from '../../config/db';
// import { ApiError } from '../../utils/ApiError';
// import { logger } from '../../utils/logger';
// import {
//   buildRecommendationPrompt,
//   buildChatSystemPrompt,
//   buildSuggestionPrompt,
// } from './ai.prompts';

// const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// // ─── Models, retry and fallback ──────────────────────────────────────────────

// const buildModels = (name: string) => ({
//   // JSON mode: for endpoints that parse the reply with JSON.parse
//   json: genAI.getGenerativeModel(
//     { model: name, generationConfig: { responseMimeType: 'application/json' } },
//     { timeout: 20000 }
//   ),
//   // Plain text mode: for the chatbot
//   chat: genAI.getGenerativeModel({ model: name }, { timeout: 20000 }),
// });

// type Models = ReturnType<typeof buildModels>;

// const primary = buildModels(env.GEMINI_MODEL);
// const fallback = buildModels(env.GEMINI_FALLBACK_MODEL);

// const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// // 503 = overloaded, 429 = rate limited, abort/timeout = request hung
// const isOverloaded = (err: any) =>
//   /\b(503|429)\b|abort|timeout|timed out|overloaded|high demand/i.test(String(err?.message));

// // Tries primary twice, then the fallback model once
// const withFallback = async <T>(run: (m: Models) => Promise<T>): Promise<T> => {
//   const attempts = [primary, primary, fallback];
//   let lastErr: unknown;

//   for (let i = 0; i < attempts.length; i++) {
//     try {
//       return await run(attempts[i]);
//     } catch (err) {
//       lastErr = err;
//       if (!isOverloaded(err)) throw err; // real errors (bad key, bad request) fail fast
//       logger.warn(`[AI] Attempt ${i + 1} failed (overloaded), retrying`);
//       if (i < attempts.length - 1) await sleep(1000 * (i + 1));
//     }
//   }
//   throw lastErr;
// };

// const toApiError = (err: unknown, fallbackMessage: string) =>
//   isOverloaded(err)
//     ? new ApiError(503, 'AI service is busy right now, please try again in a minute')
//     : new ApiError(500, fallbackMessage);

// // ─── 1. Meal Recommendations ─────────────────────────────────────────────────

// export const getMealRecommendations = async (userId: string) => {
//   const [recentOrders, availablePlans] = await Promise.all([
//     prisma.order.findMany({
//       where: { userId },
//       take: 30,
//       orderBy: { createdAt: 'desc' },
//       include: { mealPlan: true },
//     }),
//     prisma.mealPlan.findMany({ where: { isAvailable: true } }),
//   ]);

//   if (recentOrders.length === 0) {
//     return availablePlans.map((p) => ({
//       mealPlanId: p.id,
//       mealPlanName: p.name,
//       reason: 'Popular choice among our customers',
//     }));
//   }

//   const prompt = buildRecommendationPrompt(recentOrders, availablePlans);
//   try {
//     const result = await withFallback((m) => m.json.generateContent(prompt));
//     const text = result.response.text().trim();
//     return JSON.parse(text);
//   } catch (err) {
//     logger.error('[AI] Recommendation failed', err);
//     throw toApiError(err, 'Could not generate recommendations');
//   }
// };

// // ─── 2. AI Support Chatbot with Tool Calling ─────────────────────────────────

// const chatTools = [
//   {
//     name: 'get_my_orders',
//     description: "Get the customer's recent orders with status",
//     parameters: {
//       type: 'object',
//       properties: {
//         limit: { type: 'number', description: 'Number of orders to fetch (default 5)' },
//       },
//     },
//   },
//   {
//     name: 'get_my_subscriptions',
//     description: "Get the customer's active subscriptions",
//     parameters: { type: 'object', properties: {} },
//   },
//   {
//     name: 'get_meal_plans',
//     description: 'Get all available meal plans with prices',
//     parameters: { type: 'object', properties: {} },
//   },
// ];

// const executeTool = async (toolName: string, args: any, userId: string) => {
//   switch (toolName) {
//     case 'get_my_orders': {
//       const orders = await prisma.order.findMany({
//         where: { userId },
//         take: args.limit || 5,
//         orderBy: { deliveryDate: 'desc' },
//         include: { mealPlan: true },
//       });
//       return orders.map((o) => ({
//         id: o.id,
//         meal: o.mealPlan.name,
//         status: o.status,
//         deliveryDate: o.deliveryDate,
//         price: o.price,
//       }));
//     }
//     case 'get_my_subscriptions': {
//       const subs = await prisma.subscription.findMany({
//         where: { userId, status: 'ACTIVE' },
//         include: { mealPlan: true },
//       });
//       return subs.map((s) => ({
//         id: s.id,
//         plan: s.mealPlan.name,
//         status: s.status,
//         deliveryDays: s.deliveryDays,
//         startDate: s.startDate,
//       }));
//     }
//     case 'get_meal_plans':
//       return prisma.mealPlan.findMany({ where: { isAvailable: true } });
//     default:
//       return { error: 'Unknown tool' };
//   }
// };

// export const chat = async (
//   userId: string,
//   userMessage: string,
//   history: { role: 'user' | 'model'; parts: { text: string }[] }[]
// ) => {
//   const [user, availablePlans] = await Promise.all([
//     prisma.user.findUnique({ where: { id: userId } }),
//     prisma.mealPlan.findMany({ where: { isAvailable: true } }),
//   ]);

//   if (!user) throw new ApiError(404, 'User not found');

//   const systemPrompt = buildChatSystemPrompt(user.name, availablePlans);

//   const fullHistory = [
//     { role: 'user' as const, parts: [{ text: systemPrompt }] },
//     { role: 'model' as const, parts: [{ text: "Got it! I'm ready to help TiffinBox customers." }] },
//     ...history,
//   ];

//   try {
//     // A fresh chat session is created on every attempt, so a retry starts clean
//     return await withFallback(async (m) => {
//       const chatSession = m.chat.startChat({
//         history: fullHistory,
//         tools: [{ functionDeclarations: chatTools }] as any,
//       });

//       const result = await chatSession.sendMessage(userMessage);
//       const response = result.response;

//       const functionCall = response.candidates?.[0]?.content?.parts?.find(
//         (p: any) => p.functionCall
//       )?.functionCall;

//       if (functionCall) {
//         logger.info(`[AI Chat] Tool called: ${functionCall.name}`);
//         const toolResult = await executeTool(functionCall.name, functionCall.args, userId);
//         const finalResult = await chatSession.sendMessage([
//           { functionResponse: { name: functionCall.name, response: { result: toolResult } } } as any,
//         ]);
//         return { reply: finalResult.response.text() };
//       }

//       return { reply: response.text() };
//     });
//   } catch (err) {
//     logger.error('[AI] Chat failed', err);
//     throw toApiError(err, 'Could not process your message');
//   }
// };

// // ─── 3. Smart Plan Suggester ──────────────────────────────────────────────────

// export const suggestPlan = async (preference: string, budget: number, daysPerWeek: number) => {
//   const availablePlans = await prisma.mealPlan.findMany({ where: { isAvailable: true } });
//   if (availablePlans.length === 0) throw new ApiError(404, 'No meal plans available');

//   const prompt = buildSuggestionPrompt(preference, budget, daysPerWeek, availablePlans);
//   try {
//     const result = await withFallback((m) => m.json.generateContent(prompt));
//     const text = result.response.text().trim();
//     const suggestion = JSON.parse(text);
//     const plan = availablePlans.find((p) => p.id === suggestion.mealPlanId);
//     return { ...suggestion, mealPlan: plan || null };
//   } catch (err) {
//     logger.error('[AI] Suggestion failed', err);
//     throw toApiError(err, 'Could not generate suggestion');
//   }
// };