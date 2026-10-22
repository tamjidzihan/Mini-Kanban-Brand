import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface SubtaskAttributes {
  id: string;
  title: string;
  isCompleted: boolean;
  position: number;
  taskId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubtaskCreationAttributes
  extends Optional<SubtaskAttributes, 'id' | 'isCompleted' | 'position' | 'createdAt' | 'updatedAt'> {}

export class Subtask
  extends Model<SubtaskAttributes, SubtaskCreationAttributes>
  implements SubtaskAttributes
{
  declare id: string;
  declare title: string;
  declare isCompleted: boolean;
  declare position: number;
  declare taskId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Subtask.init(
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
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    position: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    taskId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Subtask',
    timestamps: true,
  }
);
