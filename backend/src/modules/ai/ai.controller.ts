import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as aiService from './ai.service';
import { ApiResponse } from '../../utils/ApiResponse';

export const getRecommendations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await aiService.getMealRecommendations(req.user!.id);
    res.json(new ApiResponse(200, data, 'Recommendations generated'));
  } catch (err) { next(err); }
};

export const chat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return next(new Error('Message is required'));
    const data = await aiService.chat(req.user!.id, message, history);
    res.json(new ApiResponse(200, data));
  } catch (err) { next(err); }
};

export const suggestPlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { preference, budget, daysPerWeek } = req.body;
    const data = await aiService.suggestPlan(preference, budget, daysPerWeek);
    res.json(new ApiResponse(200, data, 'Plan suggested'));
  } catch (err) { next(err); }
};
