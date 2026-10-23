import { Request, Response, NextFunction } from 'express';
import {
  sequelize,
  Board,
  BoardMember,
  Column,
  Task,
  Subtask,
  User,
  Op,
  Role,
} from '../models/index.js';
import { createBoardSchema, updateBoardSchema } from '../schemas/index.js';

export const getBoards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const memberships = await BoardMember.findAll({
      where: { userId, status: 'ACCEPTED' },
      attributes: ['boardId'],
    });
    const memberBoardIds = memberships.map((m) => m.boardId);

    const boards = await Board.findAll({
      where: {
        [Op.or]: [
          { ownerId: userId },
          { id: { [Op.in]: memberBoardIds } },
        ],
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatarUrl'],
        },
        {
          model: BoardMember,
          as: 'members',
          where: { status: 'ACCEPTED', role: ['EDITOR', 'VIEWER'] },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'avatarUrl'],
            },
          ],
        },
        {
          model: Column,
          as: 'columns',
          attributes: ['id'],
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    const formattedBoards = boards.map((b) => {
      const raw = b.toJSON() as any;
      return {
        id: raw.id,
        title: raw.title,
        description: raw.description,
        ownerId: raw.ownerId,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        owner: raw.owner,
        members: raw.members || [],
        _count: {
          columns: raw.columns ? raw.columns.length : 0,
          tasks: raw.tasks ? raw.tasks.length : 0,
        },
      };
    });

    res.json({ boards: formattedBoards });
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

    const board = await sequelize.transaction(async (tx) => {
      const newBoard = await Board.create(
        {
          title: data.title,
          description: data.description || null,
          ownerId: userId,
        },
        { transaction: tx }
      );

      await BoardMember.create(
        {
          boardId: newBoard.id,
          userId,
          role: 'OWNER',
          status: 'ACCEPTED',
        },
        { transaction: tx }
      );

      // Create default columns
      const defaultColumns = ['To Do', 'In Progress', 'Done'];
      await Column.bulkCreate(
        defaultColumns.map((colName, index) => ({
          title: colName,
          position: (index + 1) * 1000,
          boardId: newBoard.id,
        })),
        { transaction: tx }
      );

      return newBoard;
    });

    const fullBoard = await Board.findByPk(board.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatarUrl'] },
        {
          model: BoardMember,
          as: 'members',
          where: { status: 'ACCEPTED', role: ['EDITOR', 'VIEWER'] },
          required: false,
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatarUrl'] },
          ],
        },
        {
          model: Column,
          as: 'columns',
        },
      ],
      order: [[{ model: Column, as: 'columns' }, 'position', 'ASC']],
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

    const board = await Board.findByPk(boardId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatarUrl'] },
        {
          model: BoardMember,
          as: 'members',
          where: { status: 'ACCEPTED', role: ['EDITOR', 'VIEWER'] },
          required: false,
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatarUrl'] },
          ],
        },
        {
          model: Column,
          as: 'columns',
          include: [
            {
              model: Task,
              as: 'tasks',
              include: [
                {
                  model: User,
                  as: 'assignedTo',
                  attributes: ['id', 'name', 'email', 'avatarUrl'],
                },
                {
                  model: Subtask,
                  as: 'subtasks',
                },
              ],
            },
          ],
        },
      ],
      order: [
        [{ model: Column, as: 'columns' }, 'position', 'ASC'],
        [{ model: Column, as: 'columns' }, { model: Task, as: 'tasks' }, 'position', 'ASC'],
        [
          { model: Column, as: 'columns' },
          { model: Task, as: 'tasks' },
          { model: Subtask, as: 'subtasks' },
          'position',
          'ASC',
        ],
      ],
    });

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    const boardJson = board.toJSON() as any;

    // Determine current user's role
    let userRole = req.boardMember?.role;
    if (!userRole) {
      if (boardJson.ownerId === userId) {
        userRole = 'OWNER';
      } else {
        const member = (boardJson.members || []).find(
          (m: { userId: string; role: Role; status: string }) =>
            m.userId === userId && m.status === 'ACCEPTED'
        );
        userRole = member?.role;
      }
    }

    if (!userRole) {
      res.status(403).json({ message: 'Access denied to this board' });
      return;
    }

    res.json({ board: boardJson, currentRole: userRole });
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const data = updateBoardSchema.parse(req.body);

    const board = await Board.findByPk(boardId);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    await board.update({
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
    });

    const updatedBoard = await Board.findByPk(boardId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatarUrl'] },
      ],
    });

    res.json({ board: updatedBoard });
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;

    const deleted = await Board.destroy({
      where: { id: boardId },
    });

    if (!deleted) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

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

    const memberships = await BoardMember.findAll({
      where: { userId, status: 'ACCEPTED' },
      attributes: ['boardId'],
    });
    const memberBoardIds = memberships.map((m) => m.boardId);

    const accessibleBoards = await Board.findAll({
      where: {
        [Op.or]: [
          { ownerId: userId },
          { id: { [Op.in]: memberBoardIds } },
        ],
      },
      attributes: ['id'],
    });

    const boardIds = accessibleBoards.map((b) => b.id);

    // Search boards
    const boards = await Board.findAll({
      where: {
        id: { [Op.in]: boardIds },
        [Op.or]: [
          { title: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ],
      },
      attributes: ['id', 'title', 'description', 'updatedAt'],
      limit: 10,
    });

    // Search tasks
    const tasks = await Task.findAll({
      where: {
        boardId: { [Op.in]: boardIds },
        [Op.or]: [
          { title: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ],
      },
      include: [
        { model: Column, as: 'column', attributes: ['id', 'title'] },
        { model: Board, as: 'board', attributes: ['id', 'title'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'avatarUrl'] },
      ],
      limit: 15,
    });

    res.json({ boards, tasks });
  } catch (error) {
    next(error);
  }
};
