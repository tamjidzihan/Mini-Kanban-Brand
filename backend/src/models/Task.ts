import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskAttributes {
  id: string;
  title: string;
  description: string | null;
  columnId: string;
  boardId: string;
  position: number;
  priority: Priority;
  dueDate: Date | null;
  assignedToId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskCreationAttributes
  extends Optional<
    TaskAttributes,
    'id' | 'description' | 'priority' | 'dueDate' | 'assignedToId' | 'createdAt' | 'updatedAt'
  > {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare columnId: string;
  declare boardId: string;
  declare position: number;
  declare priority: Priority;
  declare dueDate: Date | null;
  declare assignedToId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    columnId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    boardId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    position: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      allowNull: false,
      defaultValue: 'MEDIUM',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assignedToId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Task',
    timestamps: true,
  }
);
