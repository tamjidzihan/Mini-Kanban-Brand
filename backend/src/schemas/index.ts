import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createBoardSchema = z.object({
  title: z.string().min(1, 'Board title is required').max(100),
  description: z.string().optional(),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1, 'Board title is required').max(100).optional(),
  description: z.string().nullable().optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['OWNER', 'EDITOR', 'VIEWER']).default('VIEWER'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'EDITOR', 'VIEWER']),
});

export const createColumnSchema = z.object({
  title: z.string().min(1, 'Column title is required').max(50),
  boardId: z.string().uuid('Invalid board ID'),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1, 'Column title is required').max(50),
});

export const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string().uuid()),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(150),
  description: z.string().nullable().optional(),
  columnId: z.string().uuid('Invalid column ID'),
  boardId: z.string().uuid('Invalid board ID'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(150).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
});

export const moveTaskSchema = z.object({
  targetColumnId: z.string().uuid('Invalid target column ID'),
  targetPosition: z.number().min(0, 'Position must be 0 or greater'),
});
