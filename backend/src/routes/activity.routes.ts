import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  getTaskActivities,
  getBoardActivities,
} from '../controllers/activity.controller.js';
import { requireBoardRole } from '../middlewares/boardAccess.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/tasks/:taskId', requireBoardRole(['OWNER', 'EDITOR', 'VIEWER']), getTaskActivities);
router.get('/boards/:boardId', requireBoardRole(['OWNER', 'EDITOR', 'VIEWER']), getBoardActivities);

export default router;
