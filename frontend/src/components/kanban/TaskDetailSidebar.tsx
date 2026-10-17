import React, { useState, useEffect, useRef, useId } from 'react';
import { Task, Column, User, Role, Priority, Comment, Subtask, ActivityLog } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../../lib/cn';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MarkdownViewer } from '../ui/MarkdownViewer';
import { MarkdownEditor } from '../ui/MarkdownEditor';
import {
  X,
  Calendar,
  Clock,
  User as UserIcon,
  AlignLeft,
  MessageSquare,
  Trash2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Link as LinkIcon,
  Check,
  Flame,
  CheckSquare,
  Square,
  Plus,
  History,
  Pencil,
} from 'lucide-react';

export interface TaskDetailSidebarProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  members: User[];
  userRole: Role;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => void;
}

export const TaskDetailSidebar: React.FC<TaskDetailSidebarProps> = ({
  task,
  isOpen,
  onClose,
  columns,
  members,
  userRole,
  onUpdateTask,
  onDeleteTask,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  // Basic task attributes
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState<string>('');
  const [columnId, setColumnId] = useState<string>('');
  const [assignedToId, setAssignedToId] = useState<string>('');

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<'close' | 'delete' | null>(null);

  // Bottom Tabs (Discussion vs Activity Log)
  const [activeTab, setActiveTab] = useState<'discussion' | 'activity'>('discussion');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [togglingSubtaskId, setTogglingSubtaskId] = useState<string | null>(null);
  const [deletingSubtaskId, setDeletingSubtaskId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState(false);
  const [activitiesError, setActivitiesError] = useState(false);

  const [isCopied, setIsCopied] = useState(false);
  const [pendingSaveCount, setPendingSaveCount] = useState(0);
  const isSaving = pendingSaveCount > 0;
  const pendingCloseActionRef = useRef(pendingCloseAction);
  pendingCloseActionRef.current = pendingCloseAction;

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const discardKeepEditingRef = useRef<HTMLButtonElement>(null);
  const discardReturnFocusRef = useRef<HTMLElement | null>(null);
  const panelTitleId = useId();

  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';

  const continuePendingClose = (action: 'close' | 'delete' | null) => {
    setPendingCloseAction(null);
    if (action === 'delete' && task) onDeleteTask(task.id);
    if (action) onClose();
  };

  const handleRequestClose = () => {
    if (isEditingDesc && description !== (task?.description || '')) {
      discardReturnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      setPendingCloseAction('close');
      return;
    }
    setIsEditingDesc(false);
    onClose();
  };

  const handleRequestDelete = () => {
    if (isEditingDesc && description !== (task?.description || '')) {
      discardReturnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      setPendingCloseAction('delete');
      return;
    }
    if (task) onDeleteTask(task.id);
    onClose();
  };

  const requestCloseRef = useRef(handleRequestClose);
  requestCloseRef.current = handleRequestClose;

  useEffect(() => {
    if (pendingCloseAction) {
      discardKeepEditingRef.current?.focus();
    } else {
      discardReturnFocusRef.current?.focus();
      discardReturnFocusRef.current = null;
    }
  }, [pendingCloseAction]);

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'MEDIUM');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setColumnId(task.columnId || '');
      setAssignedToId(task.assignedToId || '');
      setIsEditingDesc(false);
      setPendingCloseAction(null);
      setSubtasks([]);
      setComments([]);
      setActivities([]);

      // Load task-related details.
      fetchSubtasks(task.id);
      fetchComments(task.id);
      fetchActivities(task.id);
    }
  }, [task?.id]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';
    const focusFrame = requestAnimationFrame(() => sidebarRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      const panel = sidebarRef.current;
      if (!panel || !panel.contains(event.target as Node)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        if (pendingCloseActionRef.current) {
          setPendingCloseAction(null);
        } else {
          requestCloseRef.current();
        }
        return;
      }
      if (event.key !== 'Tab') return;

      const activeScope = pendingCloseActionRef.current
        ? panel.querySelector<HTMLElement>('[role="alertdialog"]') || panel
        : panel;
      const focusable = Array.from(
        activeScope.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        activeScope.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isOpen]);

  const fetchSubtasks = async (taskId: string) => {
    try {
      const res = await api.get(`/tasks/${taskId}/subtasks`);
      setSubtasks(res.data.subtasks || []);
    } catch (err) {
      console.error('Failed to load subtasks:', err);
    }
  };

  const fetchComments = async (taskId: string) => {
    setIsLoadingComments(true);
    setCommentsError(false);
    try {
      const res = await api.get(`/tasks/${taskId}/comments`);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setCommentsError(true);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const fetchActivities = async (taskId: string) => {
    setIsLoadingActivities(true);
    setActivitiesError(false);
    try {
      const res = await api.get(`/activity/tasks/${taskId}`);
      setActivities(res.data.activities || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setActivitiesError(true);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleFieldSave = async (field: string, value: unknown): Promise<boolean> => {
    if (!task || !canEdit) return false;
    setPendingSaveCount((count) => count + 1);
    try {
      await onUpdateTask(task.id, { [field]: value } as Partial<Task>);
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to update ${field}`);
      return false;
    } finally {
      setPendingSaveCount((count) => Math.max(0, count - 1));
    }
  };

  // --- Gemini AI Features ---
  const handleAIBreakdown = async () => {
    if (!task) return;
    setIsGeneratingSubtasks(true);
    try {
      const res = await api.post('/ai/breakdown-subtasks', {
        title: title || task.title,
        description: description || task.description,
      });

      const titles: string[] = res.data.subtasks || [];
      if (titles.length > 0) {
        const bulkRes = await api.post(`/tasks/${task.id}/subtasks/bulk`, { titles });
        setSubtasks((prev) => [...prev, ...(bulkRes.data.subtasks || [])]);
        toast.success(`Generated ${titles.length} subtasks with Gemini AI!`);
        fetchActivities(task.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate subtasks with AI');
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const handleAIEnhanceDescription = async () => {
    if (!task) return;
    setIsEnhancingDesc(true);
    try {
      const res = await api.post('/ai/enhance-description', {
        title: title || task.title,
        description: description || task.description,
      });
      if (res.data.description) {
        const previousDescription = description;
        setDescription(res.data.description);
        const saved = await handleFieldSave('description', res.data.description);
        if (saved) {
          setIsEditingDesc(false);
          toast.success('Description enhanced with Gemini AI!');
        } else {
          setDescription(previousDescription);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enhance description');
    } finally {
      setIsEnhancingDesc(false);
    }
  };

  // --- Subtasks Handlers ---
  const handleAddSubtask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task || !newSubtaskTitle.trim()) return;

    setIsAddingSubtask(true);
    try {
      const res = await api.post(`/tasks/${task.id}/subtasks`, {
        title: newSubtaskTitle.trim(),
      });
      setSubtasks((prev) => [...prev, res.data.subtask]);
      setNewSubtaskTitle('');
      fetchActivities(task.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add subtask');
    } finally {
      setIsAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    if (!canEdit || togglingSubtaskId) return;
    setTogglingSubtaskId(subtask.id);
    try {
      const nextState = !subtask.isCompleted;
      const res = await api.patch(`/tasks/subtasks/${subtask.id}`, {
        isCompleted: nextState,
      });
      setSubtasks((prev) =>
        prev.map((s) => (s.id === subtask.id ? res.data.subtask : s))
      );
      fetchActivities(task!.id);
    } catch (err: any) {
      toast.error('Failed to update subtask');
    } finally {
      setTogglingSubtaskId(null);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (deletingSubtaskId) return;
    setDeletingSubtaskId(subtaskId);
    try {
      await api.delete(`/tasks/subtasks/${subtaskId}`);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    } catch (err: any) {
      toast.error('Failed to delete subtask');
    } finally {
      setDeletingSubtaskId(null);
    }
  };

  // --- Comments Handlers ---
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task || !newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.post(`/tasks/${task.id}/comments`, {
        content: newComment.trim(),
      });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
      toast.success('Update posted.');
      fetchActivities(task.id);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task || deletingCommentId) return;
    setDeletingCommentId(commentId);
    try {
      await api.delete(`/tasks/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment removed.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleCopyLink = () => {
    if (!navigator.clipboard?.writeText) {
      toast.error('Clipboard access is unavailable.');
      return;
    }

    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setIsCopied(true);
        toast.success('Task link copied to clipboard!');
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => toast.error('Could not copy task link.'));
  };

  const handleDescriptionSave = async () => {
    if (await handleFieldSave('description', description)) {
      setIsEditingDesc(false);
    }
  };

  const handleDescriptionCancel = () => {
    setDescription(task?.description || '');
    setIsEditingDesc(false);
  };

  const handleContinueAfterSaving = async () => {
    const action = pendingCloseAction;
    if (!action) return;
    if (await handleFieldSave('description', description)) {
      setIsEditingDesc(false);
      continuePendingClose(action);
    }
  };

  const handleDiscardAndContinue = () => {
    const action = pendingCloseAction;
    setDescription(task?.description || '');
    setIsEditingDesc(false);
    continuePendingClose(action);
  };

  const handleTitleSave = () => {
    const nextTitle = title.trim();
    if (nextTitle && nextTitle !== task?.title) {
      void handleFieldSave('title', nextTitle);
    } else if (!nextTitle && task) {
      setTitle(task.title);
    }
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const tabs = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') || []
    );
    const currentIndex = tabs.indexOf(event.currentTarget);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null || tabs.length === 0) return;

    event.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  };

  if (!isOpen || !task) return null;

  const currentColumn = columns.find((c) => c.id === (columnId || task.columnId));
  const completedSubtasksCount = subtasks.filter((s) => s.isCompleted).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  // Time remaining calculation
  const calculateDetailedRemaining = () => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = dueMidnight.getTime() - nowMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysOver = Math.abs(diffDays);
      return {
        text: `Overdue by ${daysOver} ${daysOver === 1 ? 'day' : 'days'}`,
        icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
        urgency: 'critical',
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due Today (Action needed)',
        icon: <Flame className="w-4 h-4 text-amber-500 animate-pulse motion-reduce:animate-none" />,
        urgency: 'high',
      };
    } else if (diffDays === 1) {
      return {
        text: 'Due Tomorrow',
        icon: <Clock className="w-4 h-4 text-sky-500" />,
        urgency: 'medium',
      };
    } else {
      return {
        text: `${diffDays} days remaining`,
        icon: <Calendar className="w-4 h-4 text-emerald-500" />,
        urgency: 'normal',
      };
    }
  };

  const remainingInfo = calculateDetailedRemaining();

  const priorityColors = {
    LOW: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-gray-800 border-slate-300 dark:border-gray-700',
    MEDIUM: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/30',
    HIGH: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30',
    URGENT: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30',
  };

  return (
    <>
      {/* Backdrop for mobile screens */}
      <div
        className="fixed inset-0 z-40 animate-in fade-in bg-slate-900/40 backdrop-blur-xs lg:bg-transparent lg:backdrop-blur-none motion-reduce:animate-none"
        onClick={handleRequestClose}
        aria-hidden="true"
      />

      {/* Main Right Detail Space Panel */}
      <aside
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={panelTitleId}
        tabIndex={-1}
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[500px] lg:w-[520px]',
          'bg-white dark:bg-gray-900 border-l border-gray-200/90 dark:border-gray-800 shadow-2xl',
          'flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right',
          'motion-reduce:animate-none motion-reduce:transition-none'
        )}
      >
        {/* Top Sticky Header */}
        <div className="min-h-14 px-3 sm:px-5 border-b border-gray-200/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Column Selector */}
            <div className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-gray-800 py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              {canEdit ? (
                <select
                  value={columnId || task.columnId}
                  onChange={(e) => {
                    setColumnId(e.target.value);
                    handleFieldSave('columnId', e.target.value);
                  }}
                  aria-label="Task status"
                  className="max-w-28 sm:max-w-40 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer truncate dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-gray-800 [&>option]:dark:text-slate-100"
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{currentColumn?.title || 'Task'}</span>
              )}
            </div>

            {/* Priority Selector */}
            {canEdit ? (
              <select
                value={priority}
                onChange={(e) => {
                  const newP = e.target.value as Priority;
                  setPriority(newP);
                  handleFieldSave('priority', newP);
                }}
                className={cn(
                  'text-xs font-bold py-1 px-2.5 rounded-xl border outline-none cursor-pointer uppercase tracking-wider dark:[color-scheme:dark]',
                  '[&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-gray-800 [&>option]:dark:text-slate-100',
                  priorityColors[priority]
                )}
                aria-label="Task priority"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            ) : (
              <Badge variant={priority === 'URGENT' ? 'rose' : priority === 'HIGH' ? 'amber' : priority === 'MEDIUM' ? 'sky' : 'slate'}>
                {priority}
              </Badge>
            )}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label={isCopied ? 'Task link copied' : 'Copy task link'}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  handleRequestDelete();
                }}
                aria-label="Delete task"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Close task details"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-5">
          {/* Title Area */}
          <div className="space-y-1">
            {canEdit ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
                aria-label="Task title"
                aria-describedby={`${panelTitleId}-meta`}
                placeholder="Task title..."
                className="w-full text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-emerald-500 focus:outline-none transition-colors py-1"
              />
            ) : (
              <h2 id={panelTitleId} className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {task.title}
              </h2>
            )}
            {canEdit && <h2 id={panelTitleId} className="sr-only">{task.title}</h2>}
            <div id={`${panelTitleId}-meta`} className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
              <span aria-hidden="true">·</span>
              <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
              <span role="status" aria-live="polite" className="ml-auto text-emerald-600 dark:text-emerald-400">
                {isSaving ? 'Saving…' : ''}
              </span>
            </div>
          </div>

          <section aria-label="Task properties" className="divide-y divide-gray-100 dark:divide-gray-800 border-y border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-3 py-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <UserIcon className="w-4 h-4" />
                <span>Assignee</span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                {assignedToId ? (
                  <>
                    <Avatar
                      name={members.find((member) => member.id === assignedToId)?.name || 'Assignee'}
                      src={members.find((member) => member.id === assignedToId)?.avatarUrl}
                      size="xs"
                    />
                    <span className="min-w-0 truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                      {members.find((member) => member.id === assignedToId)?.name || 'Unknown user'}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">Unassigned</span>
                )}
                {canEdit && (
                  <select
                    value={assignedToId}
                    onChange={(event) => {
                      setAssignedToId(event.target.value);
                      void handleFieldSave('assignedToId', event.target.value || null);
                    }}
                    aria-label="Change assignee"
                    className="ml-auto max-w-[46%] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200 dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-gray-800 [&>option]:dark:text-slate-100"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                )}
                {user && canEdit && assignedToId !== user.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssignedToId(user.id);
                      void handleFieldSave('assignedToId', user.id);
                    }}
                    className="shrink-0 text-[11px] font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    Me
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-3 py-2.5">
              <label htmlFor={`${panelTitleId}-due`} className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Due date</span>
              </label>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <input
                  id={`${panelTitleId}-due`}
                  type="date"
                  value={dueDate}
                  disabled={!canEdit}
                  onChange={(event) => {
                    setDueDate(event.target.value);
                    void handleFieldSave('dueDate', event.target.value || null);
                  }}
                  className="min-w-0 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:border-transparent disabled:bg-transparent disabled:p-0 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200 dark:[color-scheme:dark] dark:disabled:bg-transparent"
                />
                {canEdit && dueDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setDueDate('');
                      void handleFieldSave('dueDate', null);
                    }}
                    className="text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                  >
                    Clear
                  </button>
                )}
                {remainingInfo && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-medium',
                      remainingInfo.urgency === 'critical' && 'text-rose-700 dark:text-rose-300',
                      remainingInfo.urgency === 'high' && 'text-amber-700 dark:text-amber-300',
                      remainingInfo.urgency === 'medium' && 'text-sky-700 dark:text-sky-300',
                      remainingInfo.urgency === 'normal' && 'text-emerald-700 dark:text-emerald-300'
                    )}
                  >
                    {remainingInfo.icon}
                    <span>{remainingInfo.text}</span>
                  </span>
                )}
                {!dueDate && !canEdit && <span className="text-xs text-slate-400">No due date</span>}
              </div>
            </div>
          </section>

          {/* Interactive Subtasks & Checklist */}
          <section aria-labelledby={`${panelTitleId}-subtasks`} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 id={`${panelTitleId}-subtasks`}>Checklist</h3>
                {subtasks.length > 0 && (
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                    {completedSubtasksCount}/{subtasks.length}
                  </span>
                )}
              </div>

              {/* Gemini AI Breakdown Button */}
              {canEdit && (
                <button
                  type="button"
                  onClick={handleAIBreakdown}
                  disabled={isGeneratingSubtasks}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isGeneratingSubtasks ? 'Generating…' : 'AI suggestions'}</span>
                </button>
              )}
            </div>

            {/* Subtasks Progress Bar */}
            {subtasks.length > 0 && (
              <div className="space-y-1">
                <ProgressBar value={completedSubtasksCount} max={subtasks.length} tone="emerald" />
                <div className="text-[10px] text-right text-slate-400">{subtasksPercent}% complete</div>
              </div>
            )}

            {subtasks.length > 0 ? (
              <div role="list" className="divide-y divide-gray-100 dark:divide-gray-800">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    role="listitem"
                    className="group flex items-center justify-between gap-2 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(st)}
                      disabled={!canEdit || togglingSubtaskId === st.id}
                      aria-pressed={st.isCompleted}
                      aria-label={`${st.isCompleted ? 'Mark incomplete' : 'Complete'} ${st.title}`}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-60"
                    >
                      {st.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={cn(
                          'text-xs font-medium text-slate-800 dark:text-slate-200 truncate',
                          st.isCompleted && 'line-through text-slate-400 dark:text-slate-500'
                        )}
                      >
                        {st.title}
                      </span>
                    </button>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(st.id)}
                        disabled={deletingSubtaskId === st.id}
                        aria-label={`Delete ${st.title}`}
                        className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 group-hover:opacity-100 disabled:opacity-50 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-gray-200 px-3 py-3 text-xs text-slate-500 dark:border-gray-800 dark:text-slate-400">
                {canEdit ? 'No checklist items yet. Add the first step below.' : 'No checklist items yet.'}
              </p>
            )}

            {/* Add Subtask Input Form */}
            {canEdit && (
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                <input
                  type="text"
                  aria-label="New checklist item"
                  placeholder="Add a checklist item…"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim() || isAddingSubtask}
                  aria-label="Add checklist item"
                  className="rounded-md bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40 dark:bg-gray-800 dark:text-slate-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            )}
          </section>

          <section aria-labelledby={`${panelTitleId}-description`} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <AlignLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 id={`${panelTitleId}-description`}>Description</h3>
              </div>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleAIEnhanceDescription}
                    disabled={isEnhancingDesc || isSaving}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{isEnhancingDesc ? 'Enhancing…' : 'Enhance'}</span>
                  </button>
                )}

                {canEdit && !isEditingDesc && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDesc(true)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {canEdit && isEditingDesc ? (
              <div className="space-y-2">
                <MarkdownEditor
                  value={description}
                  onChange={setDescription}
                  rows={6}
                  placeholder="Add context, decisions, or notes…"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleDescriptionCancel}
                    disabled={isSaving}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDescriptionSave}
                    disabled={isSaving || description === (task.description || '')}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-h-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {description ? (
                  <MarkdownViewer content={description} />
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {canEdit ? 'No description yet. Add context or use AI to draft one.' : 'No description provided.'}
                  </div>
                )}
              </div>
            )}
          </section>

          <section aria-label="Task conversation and activity" className="space-y-3 border-t border-gray-200/80 pt-4 dark:border-gray-800">
            <div className="border-b border-gray-200 dark:border-gray-800">
              <div role="tablist" aria-label="Task updates" className="flex gap-5">
                <button
                  type="button"
                  onClick={() => setActiveTab('discussion')}
                  onKeyDown={handleTabKeyDown}
                  role="tab"
                  id={`${panelTitleId}-discussion-tab`}
                  aria-controls={`${panelTitleId}-discussion-panel`}
                  aria-selected={activeTab === 'discussion'}
                  tabIndex={activeTab === 'discussion' ? 0 : -1}
                  className={cn(
                    'flex items-center gap-1.5 border-b-2 px-0.5 pb-2 text-xs font-semibold transition-colors',
                    activeTab === 'discussion'
                      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600'
                      : 'text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion</span>
                  <span className="font-normal text-slate-400">{comments.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  onKeyDown={handleTabKeyDown}
                  role="tab"
                  id={`${panelTitleId}-activity-tab`}
                  aria-controls={`${panelTitleId}-activity-panel`}
                  aria-selected={activeTab === 'activity'}
                  tabIndex={activeTab === 'activity' ? 0 : -1}
                  className={cn(
                    'flex items-center gap-1.5 border-b-2 px-0.5 pb-2 text-xs font-semibold transition-colors',
                    activeTab === 'activity'
                      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600'
                      : 'text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Activity</span>
                  <span className="font-normal text-slate-400">{activities.length}</span>
                </button>
              </div>
            </div>

            {activeTab === 'discussion' && (
              <div
                role="tabpanel"
                id={`${panelTitleId}-discussion-panel`}
                aria-labelledby={`${panelTitleId}-discussion-tab`}
                className="space-y-3"
              >
                <form onSubmit={handleAddComment} className="space-y-2">
                  <div className="relative">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      rows={2}
                      aria-label="Write a comment"
                      placeholder="Write a comment… (Ctrl/Cmd+Enter to send)"
                      className="w-full resize-y rounded-lg border border-gray-200 bg-white p-3 pr-11 text-sm leading-relaxed text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200 dark:[color-scheme:dark]"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmittingComment}
                      aria-label={isSubmittingComment ? 'Sending comment' : 'Send comment'}
                      className="absolute bottom-2.5 right-2 rounded-md bg-emerald-600 p-2 text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                <div role="feed" aria-label="Discussion comments" aria-busy={isLoadingComments} className="space-y-3">
                  {isLoadingComments ? (
                    <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
                      Loading discussion...
                    </div>
                  ) : commentsError ? (
                    <div role="alert" className="flex items-center justify-between gap-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      <span>Could not load comments.</span>
                      <button type="button" onClick={() => void fetchComments(task.id)} className="font-semibold underline">Retry</button>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-gray-800 dark:text-slate-400">
                      No comments yet. Share an update above!
                    </div>
                  ) : (
                    comments.map((c) => {
                      const isCommentAuthor = c.userId === user?.id;
                      const canDelete = isCommentAuthor || userRole === 'OWNER';

                      return (
                        <div
                          key={c.id}
                          className="group border-b border-gray-100 py-3 last:border-0 dark:border-gray-800"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar name={c.user?.name || 'User'} src={c.user?.avatarUrl} size="xs" />
                              <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {c.user?.name || 'Unknown User'}
                              </span>
                              <time dateTime={c.createdAt} className="shrink-0 text-[10px] text-slate-400">
                                {new Date(c.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                {new Date(c.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </time>
                            </div>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c.id)}
                                disabled={deletingCommentId === c.id}
                                aria-label="Delete comment"
                                className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 group-hover:opacity-100 disabled:opacity-50 dark:hover:bg-rose-500/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <p className="whitespace-pre-wrap pl-7 pt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {c.content}
                          </p>
                        </div>
                      );
                    })
                  )}
                  <div ref={commentsEndRef} />
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div
                role="tabpanel"
                id={`${panelTitleId}-activity-panel`}
                aria-labelledby={`${panelTitleId}-activity-tab`}
                aria-busy={isLoadingActivities}
                className="space-y-1"
              >
                {isLoadingActivities ? (
                  <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
                    Loading activity timeline...
                  </div>
                ) : activitiesError ? (
                  <div role="alert" className="flex items-center justify-between gap-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    <span>Could not load activity.</span>
                    <button type="button" onClick={() => void fetchActivities(task.id)} className="font-semibold underline">Retry</button>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-gray-800 dark:text-slate-400">
                    No activity recorded for this task yet.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start gap-2.5 border-b border-gray-100 py-3 text-xs last:border-0 dark:border-gray-800"
                    >
                      <Avatar name={act.user?.name || 'User'} src={act.user?.avatarUrl} size="xs" className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                            {act.user?.name || 'User'}
                          </span>
                          <time dateTime={act.createdAt} className="shrink-0 text-[10px] text-slate-400">
                            {new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </time>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                          {act.details || act.action}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
        {pendingCloseAction && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 p-5 backdrop-blur-[1px]">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={`${panelTitleId}-discard-title`}
              aria-describedby={`${panelTitleId}-discard-description`}
              className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
            >
              <div>
                <h3 id={`${panelTitleId}-discard-title`} className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Unsaved description
                </h3>
                <p id={`${panelTitleId}-discard-description`} className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Save your changes before {pendingCloseAction === 'delete' ? 'continuing to delete this task' : 'closing this task'}?
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  ref={discardKeepEditingRef}
                  type="button"
                  onClick={() => setPendingCloseAction(null)}
                  className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:bg-gray-800"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={handleDiscardAndContinue}
                  className="rounded-md px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  Discard and continue
                </button>
                <button
                  type="button"
                  onClick={handleContinueAfterSaving}
                  disabled={isSaving}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving…' : 'Save and continue'}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
