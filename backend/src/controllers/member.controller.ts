import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { addMemberSchema, updateMemberRoleSchema } from '../schemas/index.js';

export const getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;

    const members = await prisma.boardMember.findMany({
      where: { boardId, status: 'ACCEPTED' },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const pendingInvitations = await prisma.boardMember.findMany({
      where: { boardId, status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ members, pendingInvitations });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const data = addMemberSchema.parse(req.body);

    const targetUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!targetUser) {
      res.status(404).json({ message: 'User with this email was not found' });
      return;
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true, title: true },
    });

    if (board?.ownerId === targetUser.id) {
      res.status(400).json({ message: 'User is already the owner of this board' });
      return;
    }

    const existingMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === 'ACCEPTED') {
        res.status(409).json({ message: 'User is already an active member of this board' });
        return;
      } else if (existingMember.status === 'PENDING') {
        res.status(409).json({ message: 'An invitation is already pending for this user' });
        return;
      }
    }

    const invitation = await prisma.boardMember.create({
      data: {
        boardId,
        userId: targetUser.id,
        role: data.role,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    res.status(201).json({
      member: invitation,
      message: `Invitation sent successfully to ${targetUser.email}`,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const memberId = req.params.memberId as string;
    const data = updateMemberRoleSchema.parse(req.body);

    const member = await prisma.boardMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.boardId !== boardId) {
      res.status(404).json({ message: 'Board member not found' });
      return;
    }

    const updated = await prisma.boardMember.update({
      where: { id: memberId },
      data: { role: data.role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    res.json({ member: updated });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const memberId = req.params.memberId as string;

    const member = await prisma.boardMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.boardId !== boardId) {
      res.status(404).json({ message: 'Board member not found' });
      return;
    }

    await prisma.boardMember.delete({
      where: { id: memberId },
    });

    res.json({ message: 'Member removed from board successfully' });
  } catch (error) {
    next(error);
  }
};
