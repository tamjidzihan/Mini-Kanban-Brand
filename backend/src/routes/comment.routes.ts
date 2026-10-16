import { Router } from 'express';
import {
  getComments,
  createComment,
  deleteComment,
} from '../controllers/comment.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireBoardRole } from '../middlewares/boardAccess.middleware.js';

const router = Router({ mergeParams: true });

router.use(authenticateToken);

router.get('/:taskId/comments', requireBoardRole(['OWNER', 'EDITOR', 'VIEWER']), getComments);
router.post('/:taskId/comments', requireBoardRole(['OWNER', 'EDITOR']), createComment);
router.delete('/comments/:commentId', requireBoardRole(['OWNER', 'EDITOR', 'VIEWER']), deleteComment);

export default router;
