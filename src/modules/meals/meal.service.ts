import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { CreateMealInput, UpdateMealInput } from './meal.schema';

export const getAllMeals = () =>
  prisma.mealPlan.findMany({ where: { isAvailable: true }, orderBy: { createdAt: 'asc' } });

export const getMealById = async (id: string) => {
  const meal = await prisma.mealPlan.findUnique({ where: { id } });
  if (!meal) throw new ApiError(404, 'Meal plan not found');
  return meal;
};

export const createMeal = (data: CreateMealInput) => prisma.mealPlan.create({ data });

export const updateMeal = async (id: string, data: UpdateMealInput) => {
  await getMealById(id);
  return prisma.mealPlan.update({ where: { id }, data });
};

export const deleteMeal = async (id: string) => {
  await getMealById(id);
  return prisma.mealPlan.update({ where: { id }, data: { isAvailable: false } });
};
