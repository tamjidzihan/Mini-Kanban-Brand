import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  getSubtasks,
  createSubtask,
  createBulkSubtasks,
  updateSubtask,
  deleteSubtask,
} from '../controllers/subtask.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/:taskId/subtasks', getSubtasks);
router.post('/:taskId/subtasks', createSubtask);
router.post('/:taskId/subtasks/bulk', createBulkSubtasks);
router.patch('/subtasks/:subtaskId', updateSubtask);
router.delete('/subtasks/:subtaskId', deleteSubtask);

export default router;
