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

    await prisma.$transaction(async (tx) => {
      if (targetColumnId && targetColumnId !== columnId) {
        // Move existing tasks to targetColumnId
        await tx.task.updateMany({
          where: { columnId },
          data: { columnId: targetColumnId },
        });
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
