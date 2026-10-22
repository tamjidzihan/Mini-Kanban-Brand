import { Request, Response, NextFunction } from 'express';
import { Comment, Task, Board, User } from '../models/index.js';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
});

export const getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;

    const task = await Task.findByPk(taskId);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const comments = await Comment.findAll({
      where: { taskId },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatarUrl'],
        },
      ],
    });

    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const data = createCommentSchema.parse(req.body);

    const task = await Task.findByPk(taskId);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const comment = await Comment.create({
      content: data.content,
      taskId,
      userId,
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatarUrl'],
        },
      ],
    });

    res.status(201).json({ comment: fullComment });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const commentId = req.params.commentId as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const comment = await Comment.findByPk(commentId, {
      include: [
        {
          model: Task,
          as: 'task',
          include: [
            {
              model: Board,
              as: 'board',
            },
          ],
        },
      ],
    });

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    const taskObj = (comment as any).task;
    const boardObj = taskObj?.board;

    // Only comment author or board owner can delete
    const isAuthor = comment.userId === userId;
    const isBoardOwner = boardObj?.ownerId === userId;

    if (!isAuthor && !isBoardOwner) {
      res.status(403).json({ message: 'You do not have permission to delete this comment' });
      return;
    }

    await comment.destroy();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
