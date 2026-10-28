import { Router } from 'express';
import * as mealController from './meal.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createMealSchema, updateMealSchema } from './meal.schema';

const router = Router();

router.get('/', mealController.getAll);
router.get('/:id', mealController.getOne);
router.post('/', authenticate, authorize('ADMIN'), validate(createMealSchema), mealController.create);
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateMealSchema), mealController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), mealController.remove);

export default router;
