import { Request, Response, NextFunction } from 'express';
import { sequelize, Column, Task, Op } from '../models/index.js';
import { createColumnSchema, updateColumnSchema, reorderColumnsSchema } from '../schemas/index.js';

export const createColumn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createColumnSchema.parse(req.body);

    const maxPosCol = await Column.findOne({
      where: { boardId: data.boardId },
      order: [['position', 'DESC']],
      attributes: ['position'],
    });

    const nextPosition = (maxPosCol?.position ?? 0) + 1000;

    const column = await Column.create({
      title: data.title,
      boardId: data.boardId,
      position: nextPosition,
    });

    res.status(201).json({
      column: {
        ...column.toJSON(),
        tasks: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateColumn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const columnId = req.params.columnId as string;
    const data = updateColumnSchema.parse(req.body);

    const column = await Column.findByPk(columnId);
    if (!column) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }

    await column.update({ title: data.title });

    res.json({ column });
  } catch (error) {
    next(error);
  }
};

export const deleteColumn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const columnId = req.params.columnId as string;
    const targetColumnId = (req.body?.targetColumnId || req.query?.targetColumnId) as string | undefined;

    const sourceColumn = await Column.findByPk(columnId, {
      attributes: ['boardId'],
    });
    if (!sourceColumn) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }

    if (targetColumnId === columnId) {
      res.status(400).json({ message: 'Choose a different column for the tasks' });
      return;
    }

    if (targetColumnId) {
      const targetColumn = await Column.findByPk(targetColumnId, {
        attributes: ['boardId'],
      });
      if (!targetColumn || targetColumn.boardId !== sourceColumn.boardId) {
        res.status(400).json({ message: 'Target column must belong to the same workspace' });
        return;
      }
    }

    await sequelize.transaction(async (tx) => {
      if (targetColumnId && targetColumnId !== columnId) {
        const [sourceTasks, targetTasks] = await Promise.all([
          Task.findAll({
            where: { columnId },
            order: [['position', 'ASC']],
            attributes: ['id'],
            transaction: tx,
          }),
          Task.findAll({
            where: { columnId: targetColumnId },
            order: [['position', 'ASC']],
            attributes: ['id'],
            transaction: tx,
          }),
        ]);

        await Promise.all(
          sourceTasks.map((task, index) =>
            task.update(
              {
                columnId: targetColumnId,
                position: (targetTasks.length + index + 1) * 1000,
              },
              { transaction: tx }
            )
          )
        );
      }

      await Column.destroy({
        where: { id: columnId },
        transaction: tx,
      });
    });

    res.json({ message: 'Column deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const reorderColumns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = reorderColumnsSchema.parse(req.body);

    if (new Set(data.columnIds).size !== data.columnIds.length) {
      res.status(400).json({ message: 'Column order cannot contain duplicate IDs' });
      return;
    }

    const [columns, boardColumns] = await Promise.all([
      Column.findAll({
        where: { id: { [Op.in]: data.columnIds } },
        attributes: ['id', 'boardId'],
      }),
      Column.findAll({
        where: { boardId: req.boardMember?.boardId },
        attributes: ['id'],
      }),
    ]);

    const requestedIds = new Set(data.columnIds);
    if (
      columns.length !== data.columnIds.length ||
      columns.some((column) => column.boardId !== req.boardMember?.boardId) ||
      boardColumns.length !== data.columnIds.length ||
      boardColumns.some((column) => !requestedIds.has(column.id))
    ) {
      res.status(400).json({ message: 'Column order must include every column in the workspace' });
      return;
    }

    await sequelize.transaction(async (tx) => {
      for (let index = 0; index < data.columnIds.length; index++) {
        await Column.update(
          { position: (index + 1) * 1000 },
          { where: { id: data.columnIds[index] }, transaction: tx }
        );
      }
    });

    res.json({ message: 'Columns reordered successfully' });
  } catch (error) {
    next(error);
  }
};
