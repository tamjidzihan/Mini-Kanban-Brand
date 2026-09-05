import { Router } from 'express';
import authRoutes from './auth.routes.js';
import boardRoutes from './board.routes.js';
import memberRoutes from './member.routes.js';
import columnRoutes from './column.routes.js';
import taskRoutes from './task.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/boards', boardRoutes);
router.use('/boards', memberRoutes);
router.use('/columns', columnRoutes);
router.use('/tasks', taskRoutes);

export default router;
