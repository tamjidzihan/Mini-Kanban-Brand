import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { createColumnSchema, updateColumnSchema, reorderColumnsSchema } from '../schemas/index.js';

export const createColumn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createColumnSchema.parse(req.body);

    const maxPosCol = await prisma.column.findFirst({
      where: { boardId: data.boardId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const nextPosition = (maxPosCol?.position ?? 0) + 1000;

    const column = await prisma.column.create({
      data: {
        title: data.title,
        boardId: data.boardId,
        position: nextPosition,
      },
      include: {
        tasks: true,
      },
    });

    res.status(201).json({ column });
  } catch (error) {
    next(error);
  }
};

export const updateColumn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const columnId = req.params.columnId as string;
    const data = updateColumnSchema.parse(req.body);

    const updated = await prisma.column.update({
      where: { id: columnId },
      data: { title: data.title },
    });

    res.json({ column: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteColumn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const columnId = req.params.columnId as string;
    const targetColumnId = (req.body?.targetColumnId || req.query?.targetColumnId) as string | undefined;
    const sourceColumn = await prisma.column.findUnique({
      where: { id: columnId },
      select: { boardId: true },
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
      const targetColumn = await prisma.column.findUnique({
        where: { id: targetColumnId },
        select: { boardId: true },
      });
      if (!targetColumn || targetColumn.boardId !== sourceColumn.boardId) {
        res.status(400).json({ message: 'Target column must belong to the same workspace' });
        return;
      }
    }

    await prisma.$transaction(async (tx) => {
      if (targetColumnId && targetColumnId !== columnId) {
        const [sourceTasks, targetTasks] = await Promise.all([
          tx.task.findMany({
            where: { columnId },
            orderBy: { position: 'asc' },
            select: { id: true },
          }),
          tx.task.findMany({
            where: { columnId: targetColumnId },
            orderBy: { position: 'asc' },
            select: { id: true },
          }),
        ]);

        await Promise.all(sourceTasks.map((task, index) => tx.task.update({
          where: { id: task.id },
          data: {
            columnId: targetColumnId,
            position: (targetTasks.length + index + 1) * 1000,
          },
        })));
      }

      await tx.column.delete({
        where: { id: columnId },
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
      prisma.column.findMany({
        where: { id: { in: data.columnIds } },
        select: { id: true, boardId: true },
      }),
      prisma.column.findMany({
        where: { boardId: req.boardMember?.boardId },
        select: { id: true },
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

    await prisma.$transaction(
      data.columnIds.map((id, index) =>
        prisma.column.update({
          where: { id },
          data: { position: (index + 1) * 1000 },
        })
      )
    );

    res.json({ message: 'Columns reordered successfully' });
  } catch (error) {
    next(error);
  }
};
