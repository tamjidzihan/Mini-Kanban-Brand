import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { Column, Priority, Task, User } from '../../types';
import { AlertCircle, Calendar, User as UserIcon, Flag, Layers } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    priority: Priority;
    columnId: string;
    dueDate?: string;
    assignedToId?: string;
  }) => Promise<void>;
  columns: Column[];
  members?: User[];
  task?: Task | null;
  defaultColumnId?: string;
  isLoading?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  columns,
  members = [],
  task,
  defaultColumnId,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [columnId, setColumnId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setColumnId(task.columnId);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setAssignedToId(task.assignedToId || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setColumnId(defaultColumnId || (columns[0]?.id ?? ''));
      setDueDate('');
      setAssignedToId('');
    }
    setError('');
  }, [task, defaultColumnId, columns, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return setError('Task title is required');
    }
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        columnId,
        dueDate: dueDate || undefined,
        assignedToId: assignedToId || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save task');
    }
  };

  const priorityOptions: { value: Priority; label: string; tone: string; activeClass: string }[] = [
    {
      value: 'LOW',
      label: 'Low',
      tone: 'emerald',
      activeClass: 'bg-emerald-600 text-white border-emerald-600',
    },
    {
      value: 'MEDIUM',
      label: 'Medium',
      tone: 'sky',
      activeClass: 'bg-sky-600 text-white border-sky-600',
    },
    {
      value: 'HIGH',
      label: 'High',
      tone: 'amber',
      activeClass: 'bg-amber-600 text-white border-amber-600',
    },
    {
      value: 'URGENT',
      label: 'Urgent',
      tone: 'rose',
      activeClass: 'bg-rose-600 text-white border-rose-600',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      description={task ? 'Update task details, column, priority, or assignee.' : 'Add a new task to your board workflow.'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-500/20 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Task Title *"
          placeholder="e.g. Design authentication modal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Description"
          placeholder="Add context, acceptance criteria, or notes..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Priority Segmented Tiles (§14.27) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5" />
            <span>Priority</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {priorityOptions.map((opt) => {
              const isSelected = priority === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    'py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all duration-150',
                    isSelected
                      ? opt.activeClass
                      : 'bg-slate-50 dark:bg-gray-800 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-gray-700 hover:bg-slate-100'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Column"
            value={columnId}
            onChange={(e) => setColumnId(e.target.value)}
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>

          <Select
            label="Assignee"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.email})
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
        />

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
          >
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
