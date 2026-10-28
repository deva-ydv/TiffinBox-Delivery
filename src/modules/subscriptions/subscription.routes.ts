import { Router } from 'express';
import * as subController from './subscription.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createSubscriptionSchema } from './subscription.schema';

const router = Router();
router.use(authenticate);

router.post('/', validate(createSubscriptionSchema), subController.subscribe);
router.get('/my', subController.getMySubscriptions);
router.patch('/:id/pause', subController.pause);
router.patch('/:id/resume', subController.resume);
router.patch('/:id/cancel', subController.cancel);

router.get('/', authorize('ADMIN'), subController.getAll);

export default router;
