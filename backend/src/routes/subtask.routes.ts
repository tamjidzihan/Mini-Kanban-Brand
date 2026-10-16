import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireBoardRole } from '../middlewares/boardAccess.middleware.js';
import {
  getSubtasks,
  createSubtask,
  createBulkSubtasks,
  updateSubtask,
  deleteSubtask,
} from '../controllers/subtask.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/:taskId/subtasks', requireBoardRole(['OWNER', 'EDITOR', 'VIEWER']), getSubtasks);
router.post('/:taskId/subtasks', requireBoardRole(['OWNER', 'EDITOR']), createSubtask);
router.post('/:taskId/subtasks/bulk', requireBoardRole(['OWNER', 'EDITOR']), createBulkSubtasks);
router.patch('/subtasks/:subtaskId', requireBoardRole(['OWNER', 'EDITOR']), updateSubtask);
router.delete('/subtasks/:subtaskId', requireBoardRole(['OWNER', 'EDITOR']), deleteSubtask);

export default router;
