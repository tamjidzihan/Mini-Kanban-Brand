import { Request, Response, NextFunction } from 'express';
import { BoardMember, Board, User } from '../models/index.js';

export const getMyInvitations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const invitations = await BoardMember.findAll({
      where: {
        userId,
        status: 'PENDING',
      },
      include: [
        {
          model: Board,
          as: 'board',
          attributes: ['id', 'title', 'description'],
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email', 'avatarUrl'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ invitations });
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const invitationId = req.params.invitationId as string;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const invitation = await BoardMember.findByPk(invitationId, {
      include: [{ model: Board, as: 'board', attributes: ['title'] }],
    });

    if (!invitation || invitation.userId !== userId) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    if (invitation.status !== 'PENDING') {
      res.status(400).json({ message: 'Invitation is no longer pending' });
      return;
    }

    await invitation.update({ status: 'ACCEPTED' });

    const boardObj = (invitation as any).board;

    res.json({
      member: invitation,
      boardId: invitation.boardId,
      message: `You accepted the invitation to join "${boardObj?.title}"`,
    });
  } catch (error) {
    next(error);
  }
};

export const declineInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const invitationId = req.params.invitationId as string;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const invitation = await BoardMember.findByPk(invitationId, {
      include: [{ model: Board, as: 'board', attributes: ['title'] }],
    });

    if (!invitation || invitation.userId !== userId) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    const boardObj = (invitation as any).board;

    await invitation.destroy();

    res.json({
      message: `You declined the invitation to join "${boardObj?.title}"`,
    });
  } catch (error) {
    next(error);
  }
};