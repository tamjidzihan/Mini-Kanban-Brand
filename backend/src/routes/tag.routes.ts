import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  getBoardTags,
  createTag,
  deleteTag,
  assignTagToTask,
  removeTagFromTask,
} from '../controllers/tag.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/:boardId/tags', getBoardTags);
router.post('/:boardId/tags', createTag);
router.delete('/tags/:tagId', deleteTag);

router.post('/tasks/:taskId/tags/:tagId', assignTagToTask);
router.delete('/tasks/:taskId/tags/:tagId', removeTagFromTask);

export default router;
