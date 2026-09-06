import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export const getTaskActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const activities = await (prisma as any).activityLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      take: 50,
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

    res.status(200).json({ activities });
  } catch (err: any) {
    next(err);
  }
};

export const getBoardActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const activities = await (prisma as any).activityLog.findMany({
      where: { boardId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(200).json({ activities });
  } catch (err: any) {
    next(err);
  }
};
