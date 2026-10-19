import { Router } from 'express';
import * as aiController from './ai.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/recommendations', aiController.getRecommendations);
router.post('/chat', aiController.chat);
router.post('/suggest-plan', aiController.suggestPlan);

export default router;
