export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface BoardInvitation {
  id: string;
  boardId: string;
  userId: string;
  role: Role;
  status: InvitationStatus;
  createdAt: string;
  board: {
    id: string;
    title: string;
    description?: string | null;
    owner: User;
  };
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: Role;
  user: User;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTag {
  taskId: string;
  tagId: string;
  tag: Tag;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  position: number;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details?: string | null;
  taskId?: string | null;
  boardId: string;
  userId: string;
  user: User;
  task?: {
    id: string;
    title: string;
  } | null;
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
  estimatedHours?: number | null;
  loggedMinutes?: number;
  subtasks?: Subtask[];
  tags?: TaskTag[];
  taskTags?: TaskTag[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: User;
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
  tags?: Tag[];
  _count?: {
    tasks: number;
    columns: number;
  };
  createdAt: string;
  updatedAt: string;
}


