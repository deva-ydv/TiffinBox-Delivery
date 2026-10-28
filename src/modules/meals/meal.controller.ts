import { Request, Response, NextFunction } from 'express';
import * as mealService from './meal.service';
import { ApiResponse } from '../../utils/ApiResponse';

export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await mealService.getAllMeals();
    res.json(new ApiResponse(200, data, 'Meal plans fetched'));
  } catch (err) { next(err); }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await mealService.getMealById(req.params.id);
    res.json(new ApiResponse(200, data));
  } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await mealService.createMeal(req.body);
    res.status(201).json(new ApiResponse(201, data, 'Meal plan created'));
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await mealService.updateMeal(req.params.id, req.body);
    res.json(new ApiResponse(200, data, 'Meal plan updated'));
  } catch (err) { next(err); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await mealService.deleteMeal(req.params.id);
    res.json(new ApiResponse(200, null, 'Meal plan removed'));
  } catch (err) { next(err); }
};
