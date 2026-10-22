import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface ActivityLogAttributes {
  id: string;
  action: string;
  details: string | null;
  taskId: string | null;
  boardId: string;
  userId: string;
  createdAt?: Date;
}

export interface ActivityLogCreationAttributes
  extends Optional<ActivityLogAttributes, 'id' | 'details' | 'taskId' | 'createdAt'> {}

export class ActivityLog
  extends Model<ActivityLogAttributes, ActivityLogCreationAttributes>
  implements ActivityLogAttributes
{
  declare id: string;
  declare action: string;
  declare details: string | null;
  declare taskId: string | null;
  declare boardId: string;
  declare userId: string;
  declare readonly createdAt: Date;
}

ActivityLog.init(
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    action: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    taskId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    boardId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'ActivityLog',
    timestamps: true,
    updatedAt: false,
  }
);
