export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: Role;
  user: User;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  columnId: string;
  boardId: string;
  position: number;
  priority: Priority;
  dueDate?: string | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  boardId: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string | null;
  ownerId: string;
  owner?: User;
  members?: BoardMember[];
  columns?: Column[];
  _count?: {
    tasks: number;
    columns: number;
  };
  createdAt: string;
  updatedAt: string;
}
