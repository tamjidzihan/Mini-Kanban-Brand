import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/db.js';

export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface BoardMemberAttributes {
  id: string;
  boardId: string;
  userId: string;
  role: Role;
  status: InvitationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BoardMemberCreationAttributes
  extends Optional<BoardMemberAttributes, 'id' | 'role' | 'status' | 'createdAt' | 'updatedAt'> {}

export class BoardMember
  extends Model<BoardMemberAttributes, BoardMemberCreationAttributes>
  implements BoardMemberAttributes
{
  declare id: string;
  declare boardId: string;
  declare userId: string;
  declare role: Role;
  declare status: InvitationStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BoardMember.init(
  {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    boardId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('OWNER', 'EDITOR', 'VIEWER'),
      allowNull: false,
      defaultValue: 'VIEWER',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'DECLINED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
  },
  {
    sequelize,
    tableName: 'BoardMember',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['boardId', 'userId'],
        name: 'BoardMember_boardId_userId_key',
      },
    ],
  }
);
