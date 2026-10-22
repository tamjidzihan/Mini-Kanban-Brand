import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface CommentAttributes {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommentCreationAttributes
  extends Optional<CommentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Comment
  extends Model<CommentAttributes, CommentCreationAttributes>
  implements CommentAttributes
{
  declare id: string;
  declare content: string;
  declare taskId: string;
  declare userId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    taskId: {
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
    tableName: 'Comment',
    timestamps: true,
  }
);
