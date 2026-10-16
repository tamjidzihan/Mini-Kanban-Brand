import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireBoardRole } from '../middlewares/boardAccess.middleware.js';
import {
  getBoardTags,
  createTag,
  deleteTag,
  assignTagToTask,
  removeTagFromTask,
} from '../controllers/tag.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/:boardId/tags', requireBoardRole(['OWNER', 'EDITOR', 'VIEWER']), getBoardTags);
router.post('/:boardId/tags', requireBoardRole(['OWNER', 'EDITOR']), createTag);
router.delete('/tags/:tagId', requireBoardRole(['OWNER', 'EDITOR']), deleteTag);

router.post('/tasks/:taskId/tags/:tagId', requireBoardRole(['OWNER', 'EDITOR']), assignTagToTask);
router.delete('/tasks/:taskId/tags/:tagId', requireBoardRole(['OWNER', 'EDITOR']), removeTagFromTask);

export default router;
