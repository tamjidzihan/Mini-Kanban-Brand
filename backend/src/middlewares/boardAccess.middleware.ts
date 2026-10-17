import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/db.js';

export const requireBoardRole = (allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const body = req.body ?? {};
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

      if (!boardId && req.params.subtaskId) {
        const subtask = await prisma.subtask.findUnique({
          where: { id: req.params.subtaskId as string },
          select: { task: { select: { boardId: true } } },
        });
        if (!subtask) {
          res.status(404).json({ message: 'Subtask not found' });
          return;
        }
        boardId = subtask.task.boardId;
      }

      if (!boardId && req.params.commentId) {
        const comment = await prisma.comment.findUnique({
          where: { id: req.params.commentId as string },
          select: { task: { select: { boardId: true } } },
        });
        if (!comment) {
          res.status(404).json({ message: 'Comment not found' });
          return;
        }
        boardId = comment.task.boardId;
      }

      if (!boardId && body.boardId) {
        boardId = body.boardId as string;
      }

      if (
        !boardId &&
        Array.isArray(body.columnIds) &&
        body.columnIds.length > 0 &&
        body.columnIds.every(
          (id: unknown) => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)
        )
      ) {
        const columns = await prisma.column.findMany({
          where: { id: { in: body.columnIds } },
          select: { boardId: true },
        });
        const boardIds = new Set(columns.map((column) => column.boardId));
        if (columns.length !== body.columnIds.length || boardIds.size !== 1) {
          res.status(400).json({ message: 'Columns must all belong to the same workspace' });
          return;
        }
        boardId = columns[0].boardId;
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
        if (member && member.status === 'ACCEPTED') {
          userRole = member.role;
        }
      }

      if (!userRole || !allowedRoles.includes(userRole)) {
        res.status(403).json({ message: 'You do not have permission for this action' });
        return;
      }

      req.boardMember = { role: userRole, boardId };
      next();
    } catch (error) {
      next(error);
    }
  };
};
