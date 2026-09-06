import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
});

export const getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const comments = await (prisma as any).comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const comment = await (prisma as any).comment.create({
      data: {
        content: data.content,
        taskId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({ comment });
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

    const comment = await (prisma as any).comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Only comment author or board owner can delete
    const isAuthor = comment.userId === userId;
    const isBoardOwner = comment.task?.board?.ownerId === userId;

    if (!isAuthor && !isBoardOwner) {
      res.status(403).json({ message: 'You do not have permission to delete this comment' });
      return;
    }

    await (prisma as any).comment.delete({
      where: { id: commentId },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
