import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { logActivity } from '../utils/activity.js';

export const getSubtasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const subtasks = await (prisma as any).subtask.findMany({
      where: { taskId },
      orderBy: { position: 'asc' },
    });

    res.status(200).json({ subtasks });
  } catch (err: any) {
    next(err);
  }
};

export const createSubtask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const { title } = req.body;
    const userId = req.user?.id;

    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Subtask title is required' });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, boardId: true, title: true },
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const lastSubtask = await (prisma as any).subtask.findFirst({
      where: { taskId },
      orderBy: { position: 'desc' },
    });
    const position = lastSubtask ? lastSubtask.position + 1000 : 1000;

    const subtask = await (prisma as any).subtask.create({
      data: {
        title: title.trim(),
        taskId,
        position,
      },
    });

    if (userId) {
      await logActivity({
        action: 'SUBTASK_ADDED',
        details: `Added subtask "${title.trim()}"`,
        taskId,
        boardId: task.boardId,
        userId,
      });
    }

    res.status(201).json({ subtask });
  } catch (err: any) {
    next(err);
  }
};

export const createBulkSubtasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const { titles } = req.body;
    const userId = req.user?.id;

    if (!titles || !Array.isArray(titles) || titles.length === 0) {
      res.status(400).json({ message: 'Array of subtask titles is required' });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, boardId: true, title: true },
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const lastSubtask = await (prisma as any).subtask.findFirst({
      where: { taskId },
      orderBy: { position: 'desc' },
    });
    let currentPos = lastSubtask ? lastSubtask.position + 1000 : 1000;

    const createdSubtasks = [];
    for (const title of titles) {
      if (typeof title === 'string' && title.trim()) {
        const item = await (prisma as any).subtask.create({
          data: {
            title: title.trim(),
            taskId,
            position: currentPos,
          },
        });
        createdSubtasks.push(item);
        currentPos += 1000;
      }
    }

    if (userId) {
      await logActivity({
        action: 'SUBTASKS_GENERATED',
        details: `Generated ${createdSubtasks.length} subtasks using AI`,
        taskId,
        boardId: task.boardId,
        userId,
      });
    }

    res.status(201).json({ subtasks: createdSubtasks });
  } catch (err: any) {
    next(err);
  }
};

export const updateSubtask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subtaskId = req.params.subtaskId as string;
    const { title, isCompleted, position } = req.body;
    const userId = req.user?.id;

    const existing = await (prisma as any).subtask.findUnique({
      where: { id: subtaskId },
      include: { task: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Subtask not found' });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (position !== undefined) updateData.position = position;

    const updated = await (prisma as any).subtask.update({
      where: { id: subtaskId },
      data: updateData,
    });

    if (userId && isCompleted !== undefined && isCompleted !== existing.isCompleted) {
      await logActivity({
        action: isCompleted ? 'SUBTASK_COMPLETED' : 'SUBTASK_UNCHECKED',
        details: `${isCompleted ? 'Completed' : 'Unchecked'} subtask "${existing.title}"`,
        taskId: existing.taskId,
        boardId: existing.task.boardId,
        userId,
      });
    }

    res.status(200).json({ subtask: updated });
  } catch (err: any) {
    next(err);
  }
};

export const deleteSubtask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subtaskId = req.params.subtaskId as string;

    const existing = await (prisma as any).subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!existing) {
      res.status(404).json({ message: 'Subtask not found' });
      return;
    }

    await (prisma as any).subtask.delete({
      where: { id: subtaskId },
    });

    res.status(200).json({ message: 'Subtask deleted successfully' });
  } catch (err: any) {
    next(err);
  }
};
