import { Router } from 'express';
import authRoutes from './auth.routes.js';
import boardRoutes from './board.routes.js';
import memberRoutes from './member.routes.js';
import columnRoutes from './column.routes.js';
import taskRoutes from './task.routes.js';
import invitationRoutes from './invitation.routes.js';
import commentRoutes from './comment.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/boards', boardRoutes);
router.use('/boards', memberRoutes);
router.use('/columns', columnRoutes);
router.use('/tasks', taskRoutes);
router.use('/tasks', commentRoutes);
router.use('/invitations', invitationRoutes);

export default router;
