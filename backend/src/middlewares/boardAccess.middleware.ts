import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/db.js';

export const requireBoardRole = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      let boardId = req.params.boardId as string | undefined;

      // If boardId is not in params, check if columnId or taskId is in params
      if (!boardId && req.params.columnId) {
        const column = await prisma.column.findUnique({
          where: { id: req.params.columnId as string },
          select: { boardId: true },
        });
        if (!column) {
          res.status(404).json({ message: 'Column not found' });
          return;
        }
        boardId = column.boardId;
      }

      if (!boardId && req.params.taskId) {
        const task = await prisma.task.findUnique({
          where: { id: req.params.taskId as string },
          select: { boardId: true },
        });
        if (!task) {
          res.status(404).json({ message: 'Task not found' });
          return;
        }
        boardId = task.boardId;
      }

      if (!boardId && req.body.boardId) {
        boardId = req.body.boardId as string;
      }

      if (!boardId) {
        res.status(400).json({ message: 'Board ID is required' });
        return;
      }

      const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { ownerId: true },
      });

      if (!board) {
        res.status(404).json({ message: 'Board not found' });
        return;
      }

      // Check member role
      let userRole: Role | null = null;
      if (board.ownerId === userId) {
        userRole = 'OWNER';
      } else {
        const member = await prisma.boardMember.findUnique({
          where: {
            boardId_userId: {
              boardId,
              userId,
            },
          },
        });
        if (member) {
          userRole = member.role;
        }
      }

      if (!userRole || !allowedRoles.includes(userRole)) {
        res.status(403).json({ message: 'You do not have permission for this action' });
        return;
      }

      req.boardMember = { role: userRole };
      next();
    } catch (error) {
      next(error);
    }
  };
};
