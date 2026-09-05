import { Router } from 'express';
import {
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
} from '../controllers/invitation.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getMyInvitations);
router.post('/:invitationId/accept', acceptInvitation);
router.post('/:invitationId/decline', declineInvitation);

export default router;