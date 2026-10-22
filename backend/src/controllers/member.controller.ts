import { Request, Response, NextFunction } from 'express';
import { BoardMember, Board, User } from '../models/index.js';
import { addMemberSchema, updateMemberRoleSchema } from '../schemas/index.js';

export const getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;

    const members = await BoardMember.findAll({
      where: { boardId, status: 'ACCEPTED' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatarUrl'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    const pendingInvitations = await BoardMember.findAll({
      where: { boardId, status: 'PENDING' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatarUrl'] },
      ],
      order: [['createdAt', 'ASC']],
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

    const targetUser = await User.findOne({
      where: { email: data.email.toLowerCase() },
    });

    if (!targetUser) {
      res.status(404).json({ message: 'User with this email was not found' });
      return;
    }

    const board = await Board.findByPk(boardId, {
      attributes: ['ownerId', 'title'],
    });

    if (board?.ownerId === targetUser.id) {
      res.status(400).json({ message: 'User is already the owner of this board' });
      return;
    }

    const existingMember = await BoardMember.findOne({
      where: {
        boardId,
        userId: targetUser.id,
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

    const invitation = await BoardMember.create({
      boardId,
      userId: targetUser.id,
      role: data.role,
      status: 'PENDING',
    });

    const fullInvitation = await BoardMember.findByPk(invitation.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatarUrl'] },
      ],
    });

    res.status(201).json({
      member: fullInvitation,
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

    const member = await BoardMember.findByPk(memberId);

    if (!member || member.boardId !== boardId) {
      res.status(404).json({ message: 'Board member not found' });
      return;
    }

    const board = await Board.findByPk(boardId, {
      attributes: ['ownerId'],
    });
    if (board?.ownerId === member.userId) {
      res.status(400).json({ message: 'Workspace owner role is managed through ownership transfer' });
      return;
    }

    await member.update({ role: data.role });

    const fullMember = await BoardMember.findByPk(memberId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatarUrl'] },
      ],
    });

    res.json({ member: fullMember });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const memberId = req.params.memberId as string;

    const member = await BoardMember.findByPk(memberId);

    if (!member || member.boardId !== boardId) {
      res.status(404).json({ message: 'Board member not found' });
      return;
    }

    const board = await Board.findByPk(boardId, {
      attributes: ['ownerId'],
    });
    if (board?.ownerId === member.userId) {
      res.status(400).json({ message: 'Transfer workspace ownership before removing the owner' });
      return;
    }

    await member.destroy();

    res.json({ message: 'Member removed from board successfully' });
  } catch (error) {
    next(error);
  }
};

export const leaveBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const board = await Board.findByPk(boardId);

    if (!board) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }

    if (board.ownerId === userId) {
      res.status(400).json({
        message: 'Workspace owners cannot leave their own workspace. Delete the board or transfer ownership instead.',
      });
      return;
    }

    const member = await BoardMember.findOne({
      where: {
        boardId,
        userId,
      },
    });

    if (!member) {
      res.status(404).json({ message: 'You are not a member of this workspace' });
      return;
    }

    await member.destroy();

    res.json({ message: 'You have left the workspace successfully' });
  } catch (error) {
    next(error);
  }
};
