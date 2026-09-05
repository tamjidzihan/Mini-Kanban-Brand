import { Router } from 'express';
import {
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
} from '../controllers/member.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireBoardRole } from '../middlewares/boardAccess.middleware.js';

const router = Router({ mergeParams: true });

router.use(authenticateToken);

router.get('/:boardId/members', requireBoardRole(['OWNER', 'EDITOR', 'VIEWER']), getMembers);
router.post('/:boardId/members', requireBoardRole(['OWNER', 'EDITOR']), addMember);
router.patch('/:boardId/members/:memberId', requireBoardRole(['OWNER']), updateMemberRole);
router.delete('/:boardId/members/:memberId', requireBoardRole(['OWNER']), removeMember);

export default router;
