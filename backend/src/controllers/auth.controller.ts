import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { User, Board, BoardMember, Task, Op } from '../models/index.js';
import { ENV } from '../config/env.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../schemas/index.js';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await User.findOne({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    res.json({
      user: safeUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'avatarUrl', 'createdAt'],
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Get basic stats for profile display
    const ownedBoardsCount = await Board.count({
      where: { ownerId: userId },
    });

    const memberBoardsCount = await BoardMember.count({
      where: { userId },
    });

    const assignedTasksCount = await Task.count({
      where: { assignedToId: userId },
    });

    res.json({
      user,
      stats: {
        ownedBoards: ownedBoardsCount,
        memberBoards: memberBoardsCount,
        assignedTasks: assignedTasksCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let uploadedFilePath: string | undefined;

  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const data = updateProfileSchema.parse(req.body);
    let avatarUrl = data.avatarUrl;

    const existingUser = await User.findByPk(userId, {
      attributes: ['id', 'avatarUrl'],
    });
    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (req.file) {
      const { buffer } = req.file;
      let extension: string;

      if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        extension = 'jpg';
      } else if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      ) {
        extension = 'png';
      } else if (
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      ) {
        extension = 'webp';
      } else {
        res.status(400).json({ message: 'Choose a valid JPEG, PNG, or WebP image.' });
        return;
      }

      const avatarDirectory = path.resolve(process.cwd(), 'uploads', 'avatars');
      const filename = `${randomUUID()}.${extension}`;
      uploadedFilePath = path.join(avatarDirectory, filename);
      await mkdir(avatarDirectory, { recursive: true });
      await writeFile(uploadedFilePath, buffer, { flag: 'wx' });
      avatarUrl = `/uploads/avatars/${filename}`;
    }

    await existingUser.update({
      ...(data.name && { name: data.name }),
      ...(req.file
        ? { avatarUrl }
        : data.avatarUrl !== undefined
          ? { avatarUrl: data.avatarUrl || null }
          : {}),
    });

    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'avatarUrl', 'createdAt'],
    });

    if (
      existingUser.avatarUrl !== updatedUser?.avatarUrl &&
      existingUser.avatarUrl?.startsWith('/uploads/avatars/')
    ) {
      const oldFilename = path.basename(existingUser.avatarUrl);
      if (/^[0-9a-f-]+\.(jpg|png|webp)$/i.test(oldFilename)) {
        try {
          await unlink(path.join(process.cwd(), 'uploads', 'avatars', oldFilename));
        } catch (error) {
          console.error('Failed to remove replaced profile image:', error);
        }
      }
    }

    res.json({ user: updatedUser });
  } catch (error) {
    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
      } catch (cleanupError) {
        console.error('Failed to clean up profile image after update error:', cleanupError);
      }
    }
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const data = changePasswordSchema.parse(req.body);

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) {
      res.status(400).json({ message: 'Incorrect current password' });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await user.update({ password: hashedPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = (req.query.q as string || '').trim().toLowerCase();
    const currentUserId = req.user?.id;

    const whereConditions: any[] = [];
    if (currentUserId) {
      whereConditions.push({ id: { [Op.ne]: currentUserId } });
    }
    if (q) {
      whereConditions.push({
        [Op.or]: [
          { email: { [Op.like]: `%${q}%` } },
          { name: { [Op.like]: `%${q}%` } },
        ],
      });
    }

    const users = await User.findAll({
      where: whereConditions.length > 0 ? { [Op.and]: whereConditions } : {},
      attributes: ['id', 'name', 'email', 'avatarUrl'],
      limit: 20,
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};
