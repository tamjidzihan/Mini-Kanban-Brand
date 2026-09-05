import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Column, Task, Role } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { api } from '../../lib/api';

interface KanbanBoardProps {
  columns: Column[];
  userRole: Role;
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  userRole,
  setColumns,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnOfTask = (taskId: string): Column | undefined => {
    return columns.find((col) => col.tasks.some((t) => t.id === taskId));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    const col = findColumnOfTask(taskId);
    if (col) {
      const task = col.tasks.find((t) => t.id === taskId);
      if (task) setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findColumnOfTask(activeId);
    let overCol = findColumnOfTask(overId);

    // If over container directly
    if (!overCol) {
      overCol = columns.find((c) => c.id === overId);
    }

    if (!activeCol || !overCol || activeCol.id === overCol.id) return;

    setColumns((prevCols) => {
      const sourceColIndex = prevCols.findIndex((c) => c.id === activeCol.id);
      const destColIndex = prevCols.findIndex((c) => c.id === overCol.id);

      const sourceTasks = [...prevCols[sourceColIndex].tasks];
      const destTasks = [...prevCols[destColIndex].tasks];

      const activeTaskIndex = sourceTasks.findIndex((t) => t.id === activeId);
      const [movedTask] = sourceTasks.splice(activeTaskIndex, 1);

      // Change columnId of moved task
      const updatedTask = { ...movedTask, columnId: overCol.id };

      // Find insertion position
      const overTaskIndex = destTasks.findIndex((t) => t.id === overId);
      const insertIndex = overTaskIndex >= 0 ? overTaskIndex : destTasks.length;
      destTasks.splice(insertIndex, 0, updatedTask);

      const newCols = [...prevCols];
      newCols[sourceColIndex] = { ...newCols[sourceColIndex], tasks: sourceTasks };
      newCols[destColIndex] = { ...newCols[destColIndex], tasks: destTasks };
      return newCols;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const destCol = findColumnOfTask(activeId) || columns.find((c) => c.id === overId);
    if (!destCol) return;

    // Get final ordered task IDs in destination column
    const taskIdsOrder = destCol.tasks.map((t) => t.id);

    try {
      await api.patch(`/tasks/${activeId}/move`, {
        targetColumnId: destCol.id,
        taskIdsOrder,
      });
    } catch (error) {
      console.error('Failed to persist task position:', error);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-13rem)] items-start">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            userRole={userRole}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onEditColumn={onEditColumn}
            onDeleteColumn={onDeleteColumn}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-80 rotate-2 cursor-grabbing shadow-2xl opacity-90">
            <TaskCard
              task={activeTask}
              userRole={userRole}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
