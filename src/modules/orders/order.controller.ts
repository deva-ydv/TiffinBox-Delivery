import { Request, Response, NextFunction } from 'express';
import * as orderService from './order.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { AuthRequest } from '../../middleware/authenticate';
import { OrderStatus } from '@prisma/client';

export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const data = await orderService.getMyOrders(req.user!.id, status as OrderStatus);
    res.json(new ApiResponse(200, data, 'Orders fetched'));
  } catch (err) { next(err); }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await orderService.getOrderById(req.params.id, req.user!.id);
    res.json(new ApiResponse(200, data));
  } catch (err) { next(err); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await orderService.updateOrderStatus(req.params.id, req.body.status);
    res.json(new ApiResponse(200, data, 'Order status updated'));
  } catch (err) { next(err); }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, date } = req.query;
    const data = await orderService.getAllOrders(status as OrderStatus, date as string);
    res.json(new ApiResponse(200, data));
  } catch (err) { next(err); }
};
