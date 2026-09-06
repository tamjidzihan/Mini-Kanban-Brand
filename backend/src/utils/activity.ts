import { prisma } from '../config/db.js';

export interface LogActivityParams {
  action: string;
  details?: string;
  taskId?: string;
  boardId: string;
  userId: string;
}

export const logActivity = async (params: LogActivityParams) => {
  try {
    await (prisma as any).activityLog.create({
      data: {
        action: params.action,
        details: params.details || null,
        taskId: params.taskId || null,
        boardId: params.boardId,
        userId: params.userId,
      },
    });
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
};
