import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export const getMyInvitations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const invitations = await prisma.boardMember.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        board: {
          select: {
            id: true,
            title: true,
            description: true,
            owner: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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

    const invitation = await prisma.boardMember.findUnique({
      where: { id: invitationId },
      include: { board: { select: { title: true } } },
    });

    if (!invitation || invitation.userId !== userId) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    if (invitation.status === 'ACCEPTED') {
      res.status(400).json({ message: 'Invitation has already been accepted' });
      return;
    }

    const updated = await prisma.boardMember.update({
      where: { id: invitationId },
      data: { status: 'ACCEPTED' },
    });

    res.json({
      member: updated,
      boardId: invitation.boardId,
      message: `You accepted the invitation to join "${invitation.board.title}"`,
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

    const invitation = await prisma.boardMember.findUnique({
      where: { id: invitationId },
      include: { board: { select: { title: true } } },
    });

    if (!invitation || invitation.userId !== userId) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    await prisma.boardMember.delete({
      where: { id: invitationId },
    });

    res.json({
      message: `You declined the invitation to join "${invitation.board.title}"`,
    });
  } catch (error) {
    next(error);
  }
};