import { ActivityLog } from '../models/index.js';

export interface LogActivityParams {
  action: string;
  details?: string;
  taskId?: string;
  boardId: string;
  userId: string;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await ActivityLog.create({
      action: params.action,
      details: params.details || null,
      taskId: params.taskId || null,
      boardId: params.boardId,
      userId: params.userId,
    });
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
};
