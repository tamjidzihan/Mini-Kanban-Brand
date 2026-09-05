import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { createTaskSchema, updateTaskSchema } from '../schemas/index.js';

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createTaskSchema.parse(req.body);

    const maxPosTask = await prisma.task.findFirst({
      where: { columnId: data.columnId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const nextPosition = (maxPosTask?.position ?? 0) + 1000;

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        columnId: data.columnId,
        boardId: data.boardId,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignedToId: data.assignedToId || null,
        position: nextPosition,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const data = updateTaskSchema.parse(req.body);

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority && { priority: data.priority }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    res.json({ task: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const moveTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const { targetColumnId, targetIndex, taskIdsOrder } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // If explicit order array is provided
    if (Array.isArray(taskIdsOrder) && taskIdsOrder.length > 0) {
      await prisma.$transaction(
        taskIdsOrder.map((id: string, index: number) =>
          prisma.task.update({
            where: { id },
            data: {
              columnId: targetColumnId,
              position: (index + 1) * 1000,
            },
          })
        )
      );

      const updatedTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      res.json({ task: updatedTask, message: 'Task reordered successfully' });
      return;
    }

    // Fallback: index based placement inside targetColumnId
    const destColumnId = targetColumnId || task.columnId;
    const destIndex = typeof targetIndex === 'number' ? targetIndex : 0;

    // Get all existing tasks in destination column except the current task
    const existingTasks = await prisma.task.findMany({
      where: {
        columnId: destColumnId,
        id: { not: taskId },
      },
      orderBy: { position: 'asc' },
    });

    // Insert task at target index
    const reorderedTasks = [...existingTasks];
    const insertIdx = Math.max(0, Math.min(destIndex, reorderedTasks.length));
    reorderedTasks.splice(insertIdx, 0, task);

    // Update positions in a transaction
    await prisma.$transaction(
      reorderedTasks.map((t, idx) =>
        prisma.task.update({
          where: { id: t.id },
          data: {
            columnId: destColumnId,
            position: (idx + 1) * 1000,
          },
        })
      )
    );

    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    res.json({ task: updatedTask, message: 'Task moved successfully' });
  } catch (error) {
    next(error);
  }
};
