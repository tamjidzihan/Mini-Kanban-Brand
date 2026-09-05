import { Router } from 'express';
import {
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from '../controllers/column.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireBoardRole } from '../middlewares/boardAccess.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', requireBoardRole(['OWNER', 'EDITOR']), createColumn);
router.patch('/reorder', requireBoardRole(['OWNER', 'EDITOR']), reorderColumns);
router.patch('/:columnId', requireBoardRole(['OWNER', 'EDITOR']), updateColumn);
router.delete('/:columnId', requireBoardRole(['OWNER', 'EDITOR']), deleteColumn);

export default router;
