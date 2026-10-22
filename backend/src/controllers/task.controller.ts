import { Request, Response, NextFunction } from 'express';
import {
  sequelize,
  Task,
  Column,
  Board,
  BoardMember,
  User,
  Subtask,
  Op,
} from '../models/index.js';
import { createTaskSchema, moveTaskSchema, updateTaskSchema } from '../schemas/index.js';
import { logActivity } from '../utils/activity.js';

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createTaskSchema.parse(req.body);
    const userId = req.user?.id;

    const column = await Column.findByPk(data.columnId, {
      attributes: ['boardId'],
    });
    if (!column || column.boardId !== data.boardId) {
      res.status(400).json({ message: 'Column must belong to the selected workspace' });
      return;
    }

    if (data.assignedToId) {
      const assignee = await BoardMember.findOne({
        where: {
          boardId: data.boardId,
          userId: data.assignedToId,
        },
        attributes: ['status'],
      });
      const board = await Board.findByPk(data.boardId, {
        attributes: ['ownerId'],
      });
      if (board?.ownerId !== data.assignedToId && assignee?.status !== 'ACCEPTED') {
        res.status(400).json({ message: 'Assignee must be a member of this workspace' });
        return;
      }
    }

    const maxPosTask = await Task.findOne({
      where: { columnId: data.columnId },
      order: [['position', 'DESC']],
      attributes: ['position'],
    });

    const nextPosition = (maxPosTask?.position ?? 0) + 1000;

    const task = await Task.create({
      title: data.title,
      description: data.description || null,
      columnId: data.columnId,
      boardId: data.boardId,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assignedToId: data.assignedToId || null,
      position: nextPosition,
    });

    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatarUrl'] },
        { model: Subtask, as: 'subtasks' },
      ],
      order: [[{ model: Subtask, as: 'subtasks' }, 'position', 'ASC']],
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

    res.status(201).json({ task: fullTask });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const data = updateTaskSchema.parse(req.body);
    const userId = req.user?.id;

    const existing = await Task.findByPk(taskId);
    if (!existing) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (data.columnId) {
      const column = await Column.findByPk(data.columnId, {
        attributes: ['boardId'],
      });
      if (!column || column.boardId !== existing.boardId) {
        res.status(400).json({ message: 'Task cannot be moved to a column in another workspace' });
        return;
      }
    }

    if (data.assignedToId) {
      const assignee = await BoardMember.findOne({
        where: {
          boardId: existing.boardId,
          userId: data.assignedToId,
        },
        attributes: ['status'],
      });
      const board = await Board.findByPk(existing.boardId, {
        attributes: ['ownerId'],
      });
      if (board?.ownerId !== data.assignedToId && assignee?.status !== 'ACCEPTED') {
        res.status(400).json({ message: 'Assignee must be a member of this workspace' });
        return;
      }
    }

    await existing.update({
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority && { priority: data.priority }),
      ...(data.columnId && { columnId: data.columnId }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
    });

    const updated = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatarUrl'] },
        { model: Subtask, as: 'subtasks' },
      ],
      order: [[{ model: Subtask, as: 'subtasks' }, 'position', 'ASC']],
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
    const task = await Task.findByPk(taskId, {
      attributes: ['id'],
    });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    await Task.destroy({
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

    const task = await Task.findByPk(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const destinationColumnId = targetColumnId || task.columnId;
    const destinationColumn = await Column.findByPk(destinationColumnId, {
      attributes: ['boardId'],
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

      const orderedTasks = await Task.findAll({
        where: { id: { [Op.in]: taskIdsOrder }, boardId: task.boardId },
        attributes: ['id', 'columnId'],
      });
      const currentDestinationTasks = await Task.findAll({
        where: { columnId: destinationColumnId, id: { [Op.ne]: taskId } },
        attributes: ['id'],
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

      await sequelize.transaction(async (tx) => {
        for (let index = 0; index < taskIdsOrder.length; index++) {
          await Task.update(
            {
              columnId: destinationColumnId,
              position: (index + 1) * 1000,
            },
            {
              where: { id: taskIdsOrder[index] },
              transaction: tx,
            }
          );
        }
      });

      const updatedTask = await Task.findByPk(taskId, {
        include: [
          { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatarUrl'] },
        ],
      });

      res.json({ task: updatedTask, message: 'Task reordered successfully' });
      return;
    }

    // Fallback: index based placement inside targetColumnId
    const destColumnId = destinationColumnId;
    const destIndex = typeof targetIndex === 'number' ? targetIndex : 0;

    // Get all existing tasks in destination column except the current task
    const existingTasks = await Task.findAll({
      where: {
        columnId: destColumnId,
        id: { [Op.ne]: taskId },
      },
      order: [['position', 'ASC']],
    });

    // Insert task at target index
    const reorderedTasks = [...existingTasks];
    const insertIdx = Math.max(0, Math.min(destIndex, reorderedTasks.length));
    reorderedTasks.splice(insertIdx, 0, task);

    // Update positions in a transaction
    await sequelize.transaction(async (tx) => {
      for (let idx = 0; idx < reorderedTasks.length; idx++) {
        await Task.update(
          {
            columnId: destColumnId,
            position: (idx + 1) * 1000,
          },
          {
            where: { id: reorderedTasks[idx].id },
            transaction: tx,
          }
        );
      }
    });

    const updatedTask = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatarUrl'] },
      ],
    });

    res.json({ task: updatedTask, message: 'Task moved successfully' });
  } catch (error) {
    next(error);
  }
};
