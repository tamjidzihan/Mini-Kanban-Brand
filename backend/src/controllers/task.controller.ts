import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { createTaskSchema, moveTaskSchema, updateTaskSchema } from '../schemas/index.js';
import { logActivity } from '../utils/activity.js';

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createTaskSchema.parse(req.body);
    const userId = req.user?.id;

    const column = await prisma.column.findUnique({
      where: { id: data.columnId },
      select: { boardId: true },
    });
    if (!column || column.boardId !== data.boardId) {
      res.status(400).json({ message: 'Column must belong to the selected workspace' });
      return;
    }

    if (data.assignedToId) {
      const assignee = await prisma.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: data.boardId,
            userId: data.assignedToId,
          },
        },
        select: { status: true },
      });
      const board = await prisma.board.findUnique({
        where: { id: data.boardId },
        select: { ownerId: true },
      });
      if (board?.ownerId !== data.assignedToId && assignee?.status !== 'ACCEPTED') {
        res.status(400).json({ message: 'Assignee must be a member of this workspace' });
        return;
      }
    }

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
        subtasks: { orderBy: { position: 'asc' } },
      },
    });

    if (userId) {
      await logActivity({
        action: 'TASK_CREATED',
        details: `Created task "${data.title}"`,
        taskId: task.id,
        boardId: data.boardId,
        userId,
      });
    }

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const data = updateTaskSchema.parse(req.body);
    const userId = req.user?.id;

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (data.columnId) {
      const column = await prisma.column.findUnique({
        where: { id: data.columnId },
        select: { boardId: true },
      });
      if (!column || column.boardId !== existing.boardId) {
        res.status(400).json({ message: 'Task cannot be moved to a column in another workspace' });
        return;
      }
    }

    if (data.assignedToId) {
      const assignee = await prisma.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: existing.boardId,
            userId: data.assignedToId,
          },
        },
        select: { status: true },
      });
      const board = await prisma.board.findUnique({
        where: { id: existing.boardId },
        select: { ownerId: true },
      });
      if (board?.ownerId !== data.assignedToId && assignee?.status !== 'ACCEPTED') {
        res.status(400).json({ message: 'Assignee must be a member of this workspace' });
        return;
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority && { priority: data.priority }),
        ...(data.columnId && { columnId: data.columnId }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        subtasks: { orderBy: { position: 'asc' } },
      },
    });

    if (userId) {
      let activityDetails = 'Updated task details';
      if (data.priority && data.priority !== existing.priority) {
        activityDetails = `Changed priority from ${existing.priority} to ${data.priority}`;
      } else if (data.columnId && data.columnId !== existing.columnId) {
        activityDetails = 'Moved task to another column';
      }

      await logActivity({
        action: 'TASK_UPDATED',
        details: activityDetails,
        taskId,
        boardId: existing.boardId,
        userId,
      });
    }

    res.json({ task: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

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
    const { targetColumnId, targetIndex, taskIdsOrder } = moveTaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const destinationColumnId = targetColumnId || task.columnId;
    const destinationColumn = await prisma.column.findUnique({
      where: { id: destinationColumnId },
      select: { boardId: true },
    });
    if (!destinationColumn || destinationColumn.boardId !== task.boardId) {
      res.status(400).json({ message: 'Target column must belong to the task workspace' });
      return;
    }

    // If explicit order array is provided
    if (Array.isArray(taskIdsOrder) && taskIdsOrder.length > 0) {
      if (new Set(taskIdsOrder).size !== taskIdsOrder.length || !taskIdsOrder.includes(taskId)) {
        res.status(400).json({ message: 'Task order must contain unique IDs including the moved task' });
        return;
      }

      const orderedTasks = await prisma.task.findMany({
        where: { id: { in: taskIdsOrder }, boardId: task.boardId },
        select: { id: true, columnId: true },
      });
      const currentDestinationTasks = await prisma.task.findMany({
        where: { columnId: destinationColumnId, id: { not: taskId } },
        select: { id: true },
      });
      const expectedIds = new Set([taskId, ...currentDestinationTasks.map((item) => item.id)]);
      if (
        orderedTasks.length !== taskIdsOrder.length ||
        taskIdsOrder.some((id: string) => !expectedIds.has(id)) ||
        expectedIds.size !== taskIdsOrder.length
      ) {
        res.status(400).json({ message: 'Task order must contain every task in the destination column' });
        return;
      }

      await prisma.$transaction(
        taskIdsOrder.map((id: string, index: number) =>
          prisma.task.update({
            where: { id },
            data: {
              columnId: destinationColumnId,
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
    const destColumnId = destinationColumnId;
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
