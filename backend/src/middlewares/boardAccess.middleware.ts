import { Request, Response, NextFunction } from 'express';
import { Role, Board, BoardMember, Column, Task, Subtask, Comment, Op } from '../models/index.js';

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
        const column = await Column.findByPk(req.params.columnId as string, {
          attributes: ['boardId'],
        });
        if (!column) {
          res.status(404).json({ message: 'Column not found' });
          return;
        }
        boardId = column.boardId;
      }

      if (!boardId && req.params.taskId) {
        const task = await Task.findByPk(req.params.taskId as string, {
          attributes: ['boardId'],
        });
        if (!task) {
          res.status(404).json({ message: 'Task not found' });
          return;
        }
        boardId = task.boardId;
      }

      if (!boardId && req.params.subtaskId) {
        const subtask = await Subtask.findByPk(req.params.subtaskId as string, {
          include: [{ model: Task, as: 'task', attributes: ['boardId'] }],
        });
        const taskObj = (subtask as any)?.task;
        if (!subtask || !taskObj) {
          res.status(404).json({ message: 'Subtask not found' });
          return;
        }
        boardId = taskObj.boardId;
      }

      if (!boardId && req.params.commentId) {
        const comment = await Comment.findByPk(req.params.commentId as string, {
          include: [{ model: Task, as: 'task', attributes: ['boardId'] }],
        });
        const taskObj = (comment as any)?.task;
        if (!comment || !taskObj) {
          res.status(404).json({ message: 'Comment not found' });
          return;
        }
        boardId = taskObj.boardId;
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
        const columns = await Column.findAll({
          where: { id: { [Op.in]: body.columnIds } },
          attributes: ['boardId'],
        });
        const boardIds = new Set(columns.map((c) => c.boardId));
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

      const board = await Board.findByPk(boardId, {
        attributes: ['ownerId'],
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
        const member = await BoardMember.findOne({
          where: {
            boardId,
            userId,
            status: 'ACCEPTED',
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

      req.boardMember = { role: userRole, boardId };
      next();
    } catch (error) {
      next(error);
    }
  };
};
