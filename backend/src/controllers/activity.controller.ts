import { Request, Response, NextFunction } from 'express';
import { ActivityLog, User, Task } from '../models/index.js';

export const getTaskActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const activities = await ActivityLog.findAll({
      where: { taskId },
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatarUrl'],
        },
      ],
    });

    res.status(200).json({ activities });
  } catch (err: any) {
    next(err);
  }
};

export const getBoardActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const activities = await ActivityLog.findAll({
      where: { boardId },
      order: [['createdAt', 'DESC']],
      limit: 100,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatarUrl'],
        },
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title'],
        },
      ],
    });

    res.status(200).json({ activities });
  } catch (err: any) {
    next(err);
  }
};
