import { Router } from 'express';
import {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  searchWorkspace,
} from '../controllers/board.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireBoardRole } from '../middlewares/boardAccess.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/search', searchWorkspace);
router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:boardId', requireBoardRole(['OWNER', 'EDITOR', 'VIEWER']), getBoardById);
router.patch('/:boardId', requireBoardRole(['OWNER', 'EDITOR']), updateBoard);
router.delete('/:boardId', requireBoardRole(['OWNER']), deleteBoard);

export default router;
