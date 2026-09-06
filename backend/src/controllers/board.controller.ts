import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { createBoardSchema, updateBoardSchema } from '../schemas/index.js';

export const getBoards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId, status: 'ACCEPTED' } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: {
          where: { status: 'ACCEPTED' },
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        _count: {
          select: { tasks: true, columns: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ boards });
  } catch (error) {
    next(error);
  }
};

export const createBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const data = createBoardSchema.parse(req.body);

    const board = await prisma.$transaction(async (tx) => {
      const newBoard = await tx.board.create({
        data: {
          title: data.title,
          description: data.description,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'OWNER',
              status: 'ACCEPTED',
            },
          },
        },
      });

      // Create default columns
      const defaultColumns = ['To Do', 'In Progress', 'Done'];
      await tx.column.createMany({
        data: defaultColumns.map((colName, index) => ({
          title: colName,
          position: (index + 1) * 1000,
          boardId: newBoard.id,
        })),
      });

      return newBoard;
    });

    const fullBoard = await prisma.board.findUnique({
      where: { id: board.id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });

    res.status(201).json({ board: fullBoard });
  } catch (error) {
    next(error);
  }
};

export const getBoardById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const userId = req.user?.id;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        tags: {
          orderBy: { name: 'asc' },
        },
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
                subtasks: { orderBy: { position: 'asc' } },
                taskTags: { include: { tag: true } },
              },
            },
          },
        },
      },
    });

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Determine current user's role
    let userRole = req.boardMember?.role;
    if (!userRole) {
      if (board.ownerId === userId) {
        userRole = 'OWNER';
      } else {
        const member = board.members.find((m: { userId: string; role: any; status: string }) => m.userId === userId && m.status === 'ACCEPTED');
        userRole = member?.role;
      }
    }

    if (!userRole) {
      res.status(403).json({ message: 'Access denied to this board' });
      return;
    }

    res.json({ board, currentRole: userRole });
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const data = updateBoardSchema.parse(req.body);

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    res.json({ board: updatedBoard });
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;

    await prisma.board.delete({
      where: { id: boardId },
    });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const searchWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const q = (req.query.q as string || '').trim();

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!q) {
      res.json({ boards: [], tasks: [] });
      return;
    }

    // Accessible board IDs
    const accessibleBoards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId, status: 'ACCEPTED' } } },
        ],
      },
      select: { id: true },
    });

    const boardIds = accessibleBoards.map((b) => b.id);

    // Search boards
    const boards = await prisma.board.findMany({
      where: {
        id: { in: boardIds },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
      },
      take: 10,
    });

    // Search tasks
    const tasks = await prisma.task.findMany({
      where: {
        boardId: { in: boardIds },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        column: { select: { id: true, title: true } },
        board: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      },
      take: 15,
    });

    res.json({ boards, tasks });
  } catch (error) {
    next(error);
  }
};
