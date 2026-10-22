import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface BoardAttributes {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BoardCreationAttributes
  extends Optional<BoardAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

export class Board extends Model<BoardAttributes, BoardCreationAttributes> implements BoardAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare ownerId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Board.init(
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
    ownerId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Board',
    timestamps: true,
  }
);
