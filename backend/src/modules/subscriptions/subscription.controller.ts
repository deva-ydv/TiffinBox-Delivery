import { Request, Response, NextFunction } from 'express';
import * as subService from './subscription.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { AuthRequest } from '../../middleware/authenticate';

export const subscribe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await subService.subscribe(req.user!.id, req.body);
    res.status(201).json(new ApiResponse(201, data, 'Subscribed successfully'));
  } catch (err) { next(err); }
};

export const getMySubscriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await subService.getMySubscriptions(req.user!.id);
    res.json(new ApiResponse(200, data));
  } catch (err) { next(err); }
};

export const pause = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await subService.pauseSubscription(req.params.id, req.user!.id);
    res.json(new ApiResponse(200, data, 'Subscription paused'));
  } catch (err) { next(err); }
};

export const resume = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await subService.resumeSubscription(req.params.id, req.user!.id);
    res.json(new ApiResponse(200, data, 'Subscription resumed'));
  } catch (err) { next(err); }
};

export const cancel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await subService.cancelSubscription(req.params.id, req.user!.id);
    res.json(new ApiResponse(200, data, 'Subscription cancelled'));
  } catch (err) { next(err); }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const data = await subService.getAllSubscriptions(status as string);
    res.json(new ApiResponse(200, data));
  } catch (err) { next(err); }
};
