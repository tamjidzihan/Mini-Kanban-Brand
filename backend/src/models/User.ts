import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  name: string;
  avatarUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'avatarUrl' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare password: string;
  declare name: string;
  declare avatarUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'User',
    timestamps: true,
  }
);
