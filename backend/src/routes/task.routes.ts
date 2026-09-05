import { Router } from 'express';
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
} from '../controllers/task.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireBoardRole } from '../middlewares/boardAccess.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', requireBoardRole(['OWNER', 'EDITOR']), createTask);
router.patch('/:taskId', requireBoardRole(['OWNER', 'EDITOR']), updateTask);
router.patch('/:taskId/move', requireBoardRole(['OWNER', 'EDITOR']), moveTask);
router.delete('/:taskId', requireBoardRole(['OWNER', 'EDITOR']), deleteTask);

export default router;
