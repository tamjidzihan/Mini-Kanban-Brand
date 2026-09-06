import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  getTaskActivities,
  getBoardActivities,
} from '../controllers/activity.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/tasks/:taskId', getTaskActivities);
router.get('/boards/:boardId', getBoardActivities);

export default router;
