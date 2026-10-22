import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface ColumnAttributes {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ColumnCreationAttributes
  extends Optional<ColumnAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Column
  extends Model<ColumnAttributes, ColumnCreationAttributes>
  implements ColumnAttributes
{
  declare id: string;
  declare title: string;
  declare position: number;
  declare boardId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Column.init(
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
    position: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    boardId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Column',
    timestamps: true,
  }
);
