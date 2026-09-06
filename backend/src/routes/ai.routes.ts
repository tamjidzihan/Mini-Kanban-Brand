import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  breakdownSubtasks,
  enhanceDescription,
  generateBoard,
} from '../controllers/ai.controller.js';

const router = Router();

router.use(authenticateToken);

router.post('/breakdown-subtasks', breakdownSubtasks);
router.post('/enhance-description', enhanceDescription);
router.post('/generate-board', generateBoard);

export default router;
