import { Router } from 'express';
import authRoutes from './auth.routes.js';
import boardRoutes from './board.routes.js';
import memberRoutes from './member.routes.js';
import columnRoutes from './column.routes.js';
import taskRoutes from './task.routes.js';
import invitationRoutes from './invitation.routes.js';
import commentRoutes from './comment.routes.js';
import aiRoutes from './ai.routes.js';
import subtaskRoutes from './subtask.routes.js';
import tagRoutes from './tag.routes.js';
import activityRoutes from './activity.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/boards', boardRoutes);
router.use('/boards', memberRoutes);
router.use('/boards', tagRoutes);
router.use('/columns', columnRoutes);
router.use('/tasks', taskRoutes);
router.use('/tasks', commentRoutes);
router.use('/tasks', subtaskRoutes);
router.use('/tasks', tagRoutes);
router.use('/ai', aiRoutes);
router.use('/activity', activityRoutes);
router.use('/invitations', invitationRoutes);

export default router;
