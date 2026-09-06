import { Router } from 'express';
import {
  getComments,
  createComment,
  deleteComment,
} from '../controllers/comment.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authenticateToken);

router.get('/:taskId/comments', getComments);
router.post('/:taskId/comments', createComment);
router.delete('/comments/:commentId', deleteComment);

export default router;
