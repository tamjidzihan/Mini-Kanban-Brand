import { Request, Response, NextFunction } from 'express';
import { Subtask, Task } from '../models/index.js';
import { logActivity } from '../utils/activity.js';

export const getSubtasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const subtasks = await Subtask.findAll({
      where: { taskId },
      order: [['position', 'ASC']],
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

    const task = await Task.findByPk(taskId, {
      attributes: ['id', 'boardId', 'title'],
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const lastSubtask = await Subtask.findOne({
      where: { taskId },
      order: [['position', 'DESC']],
    });
    const position = lastSubtask ? lastSubtask.position + 1000 : 1000;

    const subtask = await Subtask.create({
      title: title.trim(),
      taskId,
      position,
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

    const task = await Task.findByPk(taskId, {
      attributes: ['id', 'boardId', 'title'],
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const lastSubtask = await Subtask.findOne({
      where: { taskId },
      order: [['position', 'DESC']],
    });
    let currentPos = lastSubtask ? lastSubtask.position + 1000 : 1000;

    const createdSubtasks = [];
    for (const title of titles) {
      if (typeof title === 'string' && title.trim()) {
        const item = await Subtask.create({
          title: title.trim(),
          taskId,
          position: currentPos,
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

    const existing = await Subtask.findByPk(subtaskId, {
      include: [{ model: Task, as: 'task' }],
    });

    if (!existing) {
      res.status(404).json({ message: 'Subtask not found' });
      return;
    }

    const taskObj = (existing as any).task;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (position !== undefined) updateData.position = position;

    const prevCompleted = existing.isCompleted;
    const prevTitle = existing.title;

    await existing.update(updateData);

    if (userId && isCompleted !== undefined && isCompleted !== prevCompleted && taskObj) {
      await logActivity({
        action: isCompleted ? 'SUBTASK_COMPLETED' : 'SUBTASK_UNCHECKED',
        details: `${isCompleted ? 'Completed' : 'Unchecked'} subtask "${prevTitle}"`,
        taskId: existing.taskId,
        boardId: taskObj.boardId,
        userId,
      });
    }

    res.status(200).json({ subtask: existing });
  } catch (err: any) {
    next(err);
  }
};

export const deleteSubtask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subtaskId = req.params.subtaskId as string;

    const existing = await Subtask.findByPk(subtaskId);

    if (!existing) {
      res.status(404).json({ message: 'Subtask not found' });
      return;
    }

    await existing.destroy();

    res.status(200).json({ message: 'Subtask deleted successfully' });
  } catch (err: any) {
    next(err);
  }
};
