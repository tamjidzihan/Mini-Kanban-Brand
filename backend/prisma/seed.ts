import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.task.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.boardMember.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create users
  const alex = await prisma.user.create({
    data: {
      name: 'Alex River',
      email: 'alex@example.com',
      password: hashedPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const sam = await prisma.user.create({
    data: {
      name: 'Sam Taylor',
      email: 'sam@example.com',
      password: hashedPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const taylor = await prisma.user.create({
    data: {
      name: 'Taylor Reed',
      email: 'taylor@example.com',
      password: hashedPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  console.log('👤 Users created: Alex (Owner), Sam (Editor), Taylor (Viewer)');

  // 2. Create Board
  const board = await prisma.board.create({
    data: {
      title: 'Product Launch Roadmap',
      description: 'Collaborative Kanban board for tracking the Q3 SaaS launch tasks and milestones.',
      ownerId: alex.id,
      members: {
        create: [
          { userId: alex.id, role: 'OWNER' },
          { userId: sam.id, role: 'EDITOR' },
          { userId: taylor.id, role: 'VIEWER' },
        ],
      },
    },
  });

  console.log(`📋 Board created: ${board.title}`);

  // 3. Create Columns
  const todoCol = await prisma.column.create({
    data: { title: 'To Do', position: 1000, boardId: board.id },
  });
  const inProgressCol = await prisma.column.create({
    data: { title: 'In Progress', position: 2000, boardId: board.id },
  });
  const inReviewCol = await prisma.column.create({
    data: { title: 'In Review', position: 3000, boardId: board.id },
  });
  const doneCol = await prisma.column.create({
    data: { title: 'Done', position: 4000, boardId: board.id },
  });

  // 4. Create Tasks
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const inTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  await prisma.task.createMany({
    data: [
      {
        title: 'Design UI Component Library',
        description: 'Establish custom Tailwind tokens, dark/light theme toggle, and common accessible UI components.',
        columnId: todoCol.id,
        boardId: board.id,
        position: 1000,
        priority: 'HIGH',
        dueDate: nextWeek,
        assignedToId: alex.id,
      },
      {
        title: 'Set up JWT & RBAC Middleware',
        description: 'Implement Express authentication routes and Role-Based Access Control logic.',
        columnId: inProgressCol.id,
        boardId: board.id,
        position: 1000,
        priority: 'URGENT',
        dueDate: nextWeek,
        assignedToId: sam.id,
      },
      {
        title: 'Integrate dnd-kit Drag-and-Drop',
        description: 'Implement smooth task dragging and drop persistence between columns.',
        columnId: inProgressCol.id,
        boardId: board.id,
        position: 2000,
        priority: 'HIGH',
        dueDate: inTwoWeeks,
        assignedToId: alex.id,
      },
      {
        title: 'Write API Integration Tests',
        description: 'Verify authorization restrictions, board sharing, and task reordering APIs.',
        columnId: inReviewCol.id,
        boardId: board.id,
        position: 1000,
        priority: 'MEDIUM',
        dueDate: inTwoWeeks,
        assignedToId: sam.id,
      },
      {
        title: 'Docker Compose Packaging',
        description: 'Create container specs for Node backend, Vite frontend, and Postgres DB.',
        columnId: doneCol.id,
        boardId: board.id,
        position: 1000,
        priority: 'LOW',
        assignedToId: taylor.id,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
