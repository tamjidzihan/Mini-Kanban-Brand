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

// Columns can only be created, renamed, reordered, or deleted by the board OWNER
router.post('/', requireBoardRole(['OWNER']), createColumn);
router.patch('/reorder', requireBoardRole(['OWNER']), reorderColumns);
router.patch('/:columnId', requireBoardRole(['OWNER']), updateColumn);
router.delete('/:columnId', requireBoardRole(['OWNER']), deleteColumn);

export default router;
