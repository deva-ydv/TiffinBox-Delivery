import { Router } from 'express';
import * as orderController from './order.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { updateOrderStatusSchema } from './order.schema';

const router = Router();
router.use(authenticate);

router.get('/my', orderController.getMyOrders);
router.get('/my/:id', orderController.getOne);

router.get('/', authorize('ADMIN'), orderController.getAll);
router.patch('/:id/status', authorize('ADMIN'), validate(updateOrderStatusSchema), orderController.updateStatus);

export default router;
