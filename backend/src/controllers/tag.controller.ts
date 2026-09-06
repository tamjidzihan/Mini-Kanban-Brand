import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { logActivity } from '../utils/activity.js';

export const getBoardTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const tags = await (prisma as any).tag.findMany({
      where: { boardId },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ tags });
  } catch (err: any) {
    next(err);
  }
};

export const createTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const { name, color = 'emerald' } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Tag name is required' });
      return;
    }

    const tag = await (prisma as any).tag.create({
      data: {
        name: name.trim(),
        color,
        boardId,
      },
    });

    res.status(201).json({ tag });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(400).json({ message: 'A tag with this name already exists on this board' });
      return;
    }
    next(err);
  }
};

export const deleteTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tagId = req.params.tagId as string;
    await (prisma as any).tag.delete({
      where: { id: tagId },
    });

    res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (err: any) {
    next(err);
  }
};

export const assignTagToTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const tagId = req.params.tagId as string;
    const userId = req.user?.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, boardId: true },
    });
    const tag = await (prisma as any).tag.findUnique({
      where: { id: tagId },
    });

    if (!task || !tag) {
      res.status(404).json({ message: 'Task or Tag not found' });
      return;
    }

    const taskTag = await (prisma as any).taskTag.upsert({
      where: {
        taskId_tagId: {
          taskId,
          tagId,
        },
      },
      update: {},
      data: {
        taskId,
        tagId,
      },
      include: {
        tag: true,
      },
    });

    if (userId) {
      await logActivity({
        action: 'TAG_ASSIGNED',
        details: `Assigned tag "${tag.name}"`,
        taskId,
        boardId: task.boardId,
        userId,
      });
    }

    res.status(200).json({ taskTag });
  } catch (err: any) {
    next(err);
  }
};

export const removeTagFromTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const tagId = req.params.tagId as string;
    await (prisma as any).taskTag.deleteMany({
      where: {
        taskId,
        tagId,
      },
    });

    res.status(200).json({ message: 'Tag removed from task' });
  } catch (err: any) {
    next(err);
  }
};
