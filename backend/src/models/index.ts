import { Op } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './User.js';
import { Board } from './Board.js';
import { BoardMember, Role, InvitationStatus } from './BoardMember.js';
import { Column } from './Column.js';
import { Task, Priority } from './Task.js';
import { Subtask } from './Subtask.js';
import { Comment } from './Comment.js';
import { ActivityLog } from './ActivityLog.js';

// User <-> Board (Ownership)
User.hasMany(Board, { foreignKey: 'ownerId', as: 'ownedBoards', onDelete: 'CASCADE' });
Board.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User <-> BoardMember
User.hasMany(BoardMember, { foreignKey: 'userId', as: 'boardMembers', onDelete: 'CASCADE' });
BoardMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Board <-> BoardMember
Board.hasMany(BoardMember, { foreignKey: 'boardId', as: 'members', onDelete: 'CASCADE' });
BoardMember.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });

// Board <-> Column
Board.hasMany(Column, { foreignKey: 'boardId', as: 'columns', onDelete: 'CASCADE' });
Column.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });

// Board <-> Task
Board.hasMany(Task, { foreignKey: 'boardId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });

// Column <-> Task
Column.hasMany(Task, { foreignKey: 'columnId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Column, { foreignKey: 'columnId', as: 'column' });

// User <-> Task (Assigned)
User.hasMany(Task, { foreignKey: 'assignedToId', as: 'assignedTasks', onDelete: 'SET NULL' });
Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });

// Task <-> Subtask
Task.hasMany(Subtask, { foreignKey: 'taskId', as: 'subtasks', onDelete: 'CASCADE' });
Subtask.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

// Task <-> Comment
Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

// User <-> Comment
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Board <-> ActivityLog
Board.hasMany(ActivityLog, { foreignKey: 'boardId', as: 'activityLogs', onDelete: 'CASCADE' });
ActivityLog.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });

// Task <-> ActivityLog
Task.hasMany(ActivityLog, { foreignKey: 'taskId', as: 'activityLogs', onDelete: 'CASCADE' });
ActivityLog.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

// User <-> ActivityLog
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs', onDelete: 'CASCADE' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  sequelize,
  Op,
  User,
  Board,
  BoardMember,
  Column,
  Task,
  Subtask,
  Comment,
  ActivityLog,
  Role,
  InvitationStatus,
  Priority,
};
