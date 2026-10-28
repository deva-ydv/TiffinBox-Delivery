import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../config/env';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../utils/logger';
import {
  buildRecommendationPrompt,
  buildChatSystemPrompt,
  buildSuggestionPrompt,
} from './ai.prompts';

const genAI = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

// Use a model supported by your Gemini API key.
// You can override this using the GEMINI_MODEL environment variable.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// ─── Shared Helpers ──────────────────────────────────────────────────────────

const generateContent = async (
  contents: any,
  config: Record<string, any> = {},
) => {
  try {
    return await genAI.models.generateContent({
      model: MODEL,
      contents,
      config,
    });
  } catch (error: any) {
    logger.error('[AI] Gemini request failed', {
      status: error?.status,
      message: error?.message,
    });

    if (
      error?.status === 503 ||
      error?.status === 429 ||
      error?.status === 504
    ) {
      throw new ApiError(
        503,
        'AI service is temporarily unavailable. Please try again shortly.',
      );
    }

    throw new ApiError(502, 'Failed to communicate with the AI service');
  }
};

// const generateContent = async (
//   contents: any,
//   config: Record<string, any> = {},
// ) => {
//   const startedAt = Date.now();

//   try {
//     logger.info("[AI] Gemini request started", {
//       model: MODEL,
//       timestamp: new Date().toISOString(),
//     });

//     const result = await genAI.models.generateContent({
//       model: MODEL,
//       contents,
//       config,
//     });

//     logger.info("[AI] Gemini request completed", {
//       durationMs: Date.now() - startedAt,
//       hasText: Boolean(result.text),
//       functionCalls: result.functionCalls?.length ?? 0,
//     });

//     return result;
//   } catch (error: any) {
//     logger.error("[AI] Gemini request failed", {
//       durationMs: Date.now() - startedAt,
//       status: error?.status,
//       message: error?.message,
//       details: error?.details,
//     });

//     if (
//       error?.status === 429 ||
//       error?.status === 503 ||
//       error?.status === 504
//     ) {
//       throw new ApiError(
//         503,
//         "AI service is temporarily unavailable. Please try again shortly.",
//       );
//     }

//     throw new ApiError(
//       502,
//       "Failed to communicate with the AI service",
//     );
//   }
// };


const parseJsonResponse = (text: string) => {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned an invalid JSON response');
  }
};

// ─── 1. Meal Recommendations ─────────────────────────────────────────────────

export const getMealRecommendations = async (userId: string) => {
  const [recentOrders, availablePlans] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: { mealPlan: true },
    }),
    prisma.mealPlan.findMany({
      where: { isAvailable: true },
    }),
  ]);

  if (availablePlans.length === 0) {
    throw new ApiError(404, 'No meal plans available');
  }

  if (recentOrders.length === 0) {
    return availablePlans.slice(0, 2).map((plan) => ({
      mealPlanId: plan.id,
      mealPlanName: plan.name,
      reason: 'A popular choice among our available meal plans.',
    }));
  }

  const prompt = buildRecommendationPrompt(
    recentOrders,
    availablePlans,
  );

  try {
    const result = await generateContent(prompt, {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            mealPlanId: { type: Type.STRING },
            mealPlanName: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ['mealPlanId', 'mealPlanName', 'reason'],
        },
      },
    });

    const text = result.text;

    if (!text) {
      throw new Error('AI returned an empty response');
    }

    const recommendations = parseJsonResponse(text);

    if (!Array.isArray(recommendations)) {
      throw new Error('Invalid recommendations format');
    }

    // Only return plans that actually exist and are available.
    return recommendations
      .filter((item: any) =>
        availablePlans.some((plan) => plan.id === item.mealPlanId),
      )
      .slice(0, 2);
  } catch (error) {
    if (error instanceof ApiError) throw error;

    logger.error('[AI] Recommendation failed', error);
    throw new ApiError(502, 'Could not generate recommendations');
  }
};

// ─── 2. AI Support Chatbot with Tool Calling ─────────────────────────────────

const chatTools = [
  {
    name: 'get_my_orders',
    description: "Get the authenticated customer's recent orders and status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.NUMBER,
          description: 'Number of orders to fetch, from 1 to 10.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_my_subscriptions',
    description: "Get the authenticated customer's active subscriptions.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_meal_plans',
    description: 'Get all currently available meal plans and their prices.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

const executeTool = async (
  toolName: string,
  args: Record<string, any>,
  userId: string,
) => {
  switch (toolName) {
    case 'get_my_orders': {
      const requestedLimit = Number(args?.limit ?? 5);
      const limit = Number.isFinite(requestedLimit)
        ? Math.min(10, Math.max(1, Math.floor(requestedLimit)))
        : 5;

      const orders = await prisma.order.findMany({
        where: { userId },
        take: limit,
        orderBy: { deliveryDate: 'desc' },
        include: { mealPlan: true },
      });

      return orders.map((order) => ({
        id: order.id,
        meal: order.mealPlan.name,
        status: order.status,
        deliveryDate: order.deliveryDate,
        price: order.price,
      }));
    }

    case 'get_my_subscriptions': {
      const subscriptions = await prisma.subscription.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        include: { mealPlan: true },
      });

      return subscriptions.map((subscription) => ({
        id: subscription.id,
        plan: subscription.mealPlan.name,
        status: subscription.status,
        deliveryDays: subscription.deliveryDays,
        startDate: subscription.startDate,
      }));
    }

    case 'get_meal_plans': {
      const plans = await prisma.mealPlan.findMany({
        where: { isAvailable: true },
      });

      return plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        pricePerDay: plan.pricePerDay,
      }));
    }

    default:
      return { error: 'Unknown tool' };
  }
};

type ChatHistoryItem = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export const chat = async (
  userId: string,
  userMessage: string,
  history: ChatHistoryItem[] = [],
) => {
  const [user, availablePlans] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),
    prisma.mealPlan.findMany({
      where: { isAvailable: true },
    }),
  ]);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const systemPrompt = buildChatSystemPrompt(
    user.name,
    availablePlans,
  );

  // Keep the system instruction separate from conversation history.
  const contents: any[] = [
    ...history.map((item) => ({
      role: item.role,
      parts: item.parts.map((part) => ({
        text: part.text,
      })),
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const config = {
    systemInstruction: systemPrompt,
    tools: [
      {
        functionDeclarations: chatTools,
      },
    ],
  };

  // Allow multiple sequential tool calls, but prevent infinite loops.
  const maxToolRounds = 5;

  try {
    for (let round = 0; round <= maxToolRounds; round++) {
      const result = await generateContent(contents, config);
      const response = result;

      const functionCalls = response.functionCalls ?? [];

      if (functionCalls.length === 0) {
        const reply = response.text;

        if (!reply) {
          throw new Error('AI returned an empty response');
        }

        return { reply };
      }

      if (round === maxToolRounds) {
        throw new Error('AI exceeded the maximum number of tool calls');
      }

      // Include the model's function calls in the conversation.
      // contents.push({
      //   role: 'model',
      //   parts: functionCalls.map((call) => ({
      //     functionCall: {
      //       name: call.name,
      //       args: call.args ?? {},
      //     },
      //   })),
      // });
      // Preserve the complete model response, including thought signatures.
contents.push({
  role: 'model',
  parts: response.candidates?.[0]?.content?.parts ?? [],
});

      // Execute each requested function on the server.
      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          if (!call.name) {
            return {
              functionResponse: {
                name: 'unknown',
                response: { error: 'Missing function name' },
              },
            };
          }

          logger.info(`[AI Chat] Tool called: ${call.name}`);

          try {
            const toolResult = await executeTool(
              call.name,
              (call.args ?? {}) as Record<string, any>,
              userId,
            );

            return {
              functionResponse: {
                name: call.name,
                response: { result: toolResult },
              },
            };
          } catch (error) {
            logger.error(`[AI Chat] Tool failed: ${call.name}`, error);

            return {
              functionResponse: {
                name: call.name,
                response: {
                  error: 'Unable to retrieve the requested information.',
                },
              },
            };
          }
        }),
      );

      // Send real database results back to Gemini.
      contents.push({
        role: 'user',
        parts: functionResponses,
      });
    }

    throw new Error('AI conversation could not be completed');
  } catch (error) {
    if (error instanceof ApiError) throw error;

    logger.error('[AI] Chat failed', error);
    throw new ApiError(502, 'Could not process your chat message');
  }
};

// ─── 3. Smart Plan Suggester ─────────────────────────────────────────────────

export const suggestPlan = async (
  preference: string,
  budget: number,
  daysPerWeek: number,
) => {
  const availablePlans = await prisma.mealPlan.findMany({
    where: { isAvailable: true },
  });

  if (availablePlans.length === 0) {
    throw new ApiError(404, 'No meal plans available');
  }

  const prompt = buildSuggestionPrompt(
    preference,
    budget,
    daysPerWeek,
    availablePlans,
  );

  try {
    const result = await generateContent(prompt, {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mealPlanId: { type: Type.STRING },
          mealPlanName: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ['mealPlanId', 'mealPlanName', 'explanation'],
      },
    });

    const text = result.text;

    if (!text) {
      throw new Error('AI returned an empty response');
    }

    const suggestion = parseJsonResponse(text);

    const plan = availablePlans.find(
      (item) => item.id === suggestion.mealPlanId,
    );

    if (!plan) {
      throw new Error('AI suggested an unavailable meal plan');
    }

    return {
      ...suggestion,
      mealPlan: plan,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    logger.error('[AI] Suggestion failed', error);
    throw new ApiError(502, 'Could not generate meal plan suggestion');
  }
};
