import React, { useState, useEffect, useRef } from 'react';
import { Task, Column, User, Role, Priority, Comment, Subtask, Tag, ActivityLog } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../../lib/cn';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { MarkdownViewer } from '../ui/MarkdownViewer';
import {
  X,
  Calendar,
  Clock,
  User as UserIcon,
  Tag as TagIcon,
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
  Play,
  Pause,
  History,
  Timer,
  Pencil,
  Eye,
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
  const [estimatedHours, setEstimatedHours] = useState<number | string>('');
  const [loggedMinutes, setLoggedMinutes] = useState<number>(0);

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // Tags state
  const [boardTags, setBoardTags] = useState<Tag[]>([]);
  const [taskTags, setTaskTags] = useState<Tag[]>([]);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('emerald');

  // Time Tracking Stopwatch
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Bottom Tabs (Discussion vs Activity Log)
  const [activeTab, setActiveTab] = useState<'discussion' | 'activity'>('discussion');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useClickOutside<HTMLDivElement>(() => setIsTagDropdownOpen(false), isTagDropdownOpen);

  const sidebarRef = useClickOutside<HTMLElement>(() => {
    if (isOpen) onClose();
  }, isOpen);

  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'MEDIUM');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setColumnId(task.columnId || '');
      setAssignedToId(task.assignedToId || '');
      setEstimatedHours(task.estimatedHours ?? '');
      setLoggedMinutes(task.loggedMinutes || 0);

      // Load subtasks & tags from task if provided, or fetch
      fetchSubtasks(task.id);
      fetchBoardTags(task.boardId);
      fetchTaskTags(task);
      fetchComments(task.id);
      fetchActivities(task.id);
    }
  }, [task?.id]);

  // Stopwatch Interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isTimerRunning && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchSubtasks = async (taskId: string) => {
    try {
      const res = await api.get(`/tasks/${taskId}/subtasks`);
      setSubtasks(res.data.subtasks || []);
    } catch (err) {
      console.error('Failed to load subtasks:', err);
    }
  };

  const fetchBoardTags = async (boardId: string) => {
    try {
      const res = await api.get(`/boards/${boardId}/tags`);
      setBoardTags(res.data.tags || []);
    } catch (err) {
      console.error('Failed to load board tags:', err);
    }
  };

  const fetchTaskTags = (currentTask: Task) => {
    if (currentTask.taskTags) {
      setTaskTags(currentTask.taskTags.map((tt: any) => tt.tag).filter(Boolean));
    } else {
      setTaskTags([]);
    }
  };

  const fetchComments = async (taskId: string) => {
    setIsLoadingComments(true);
    try {
      const res = await api.get(`/tasks/${taskId}/comments`);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const fetchActivities = async (taskId: string) => {
    setIsLoadingActivities(true);
    try {
      const res = await api.get(`/activity/tasks/${taskId}`);
      setActivities(res.data.activities || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleFieldSave = async (field: string, value: any) => {
    if (!task || !canEdit) return;
    setIsSaving(true);
    try {
      await onUpdateTask(task.id, { [field]: value });
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to update ${field}`);
    } finally {
      setIsSaving(false);
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
        setDescription(res.data.description);
        setIsEditingDesc(false);
        await handleFieldSave('description', res.data.description);
        toast.success('Description enhanced with Gemini AI!');
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

    try {
      const res = await api.post(`/tasks/${task.id}/subtasks`, {
        title: newSubtaskTitle.trim(),
      });
      setSubtasks((prev) => [...prev, res.data.subtask]);
      setNewSubtaskTitle('');
      fetchActivities(task.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
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
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await api.delete(`/tasks/subtasks/${subtaskId}`);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    } catch (err: any) {
      toast.error('Failed to delete subtask');
    }
  };

  // --- Tags Handlers ---
  const handleToggleTag = async (tag: Tag) => {
    if (!task) return;
    const isAssigned = taskTags.some((t) => t.id === tag.id);
    try {
      if (isAssigned) {
        await api.delete(`/tasks/${task.id}/tags/${tag.id}`);
        setTaskTags((prev) => prev.filter((t) => t.id !== tag.id));
      } else {
        await api.post(`/tasks/${task.id}/tags/${tag.id}`);
        setTaskTags((prev) => [...prev, tag]);
      }
      fetchActivities(task.id);
    } catch (err: any) {
      toast.error('Failed to update tag');
    }
  };

  const handleCreateNewTag = async () => {
    if (!task || !newTagName.trim()) return;
    try {
      const res = await api.post(`/boards/${task.boardId}/tags`, {
        name: newTagName.trim(),
        color: newTagColor,
      });
      const createdTag = res.data.tag;
      setBoardTags((prev) => [...prev, createdTag]);
      await handleToggleTag(createdTag);
      setNewTagName('');
      toast.success('Tag created and assigned.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create tag');
    }
  };

  // --- Time Tracking Handlers ---
  const handleToggleTimer = () => {
    if (isTimerRunning) {
      // Stopping timer: add accumulated minutes to loggedMinutes
      const addedMinutes = Math.round(timerSeconds / 60);
      if (addedMinutes > 0) {
        const nextTotal = (loggedMinutes || 0) + addedMinutes;
        setLoggedMinutes(nextTotal);
        handleFieldSave('loggedMinutes', nextTotal);
        toast.success(`Logged ${addedMinutes}m of work.`);
      }
      setIsTimerRunning(false);
      setTimerSeconds(0);
    } else {
      setIsTimerRunning(true);
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
    if (!task) return;
    try {
      await api.delete(`/tasks/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment removed.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success('Task link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen || !task) return null;

  const currentColumn = columns.find((c) => c.id === (columnId || task.columnId));
  const completedSubtasksCount = subtasks.filter((s) => s.isCompleted).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  // Format stopwatch timer seconds
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}`;
  };

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
        icon: <Flame className="w-4 h-4 text-amber-500 animate-pulse" />,
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

  const tagColors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    sky: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
    violet: 'bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30',
    rose: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
    amber: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    slate: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-gray-800 dark:text-slate-300 dark:border-gray-700',
  };

  return (
    <>
      {/* Backdrop for mobile screens */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
        onClick={onClose}
      />

      {/* Main Right Detail Space Panel */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[500px] lg:w-[520px]',
          'bg-white dark:bg-gray-900 border-l border-gray-200/90 dark:border-gray-800 shadow-2xl',
          'flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right'
        )}
      >
        {/* Top Sticky Header */}
        <div className="p-4 sm:px-6 border-b border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {/* Column Selector */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-gray-800 py-1 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              {canEdit ? (
                <select
                  value={columnId || task.columnId}
                  onChange={(e) => {
                    setColumnId(e.target.value);
                    handleFieldSave('columnId', e.target.value);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-gray-800 [&>option]:dark:text-slate-100"
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
              title="Copy task link"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(task.id);
                  onClose();
                }}
                title="Delete task"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              title="Close panel (Esc)"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Title Area */}
          <div className="space-y-1.5">
            {canEdit ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title.trim() && title !== task.title) {
                    handleFieldSave('title', title.trim());
                  }
                }}
                placeholder="Task title..."
                className="w-full text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-emerald-500 focus:outline-none transition-colors py-1"
              />
            ) : (
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {task.title}
              </h2>
            )}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Updated {new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Tags / Labels Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <TagIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Labels & Tags</span>
              </div>

              {canEdit && (
                <div ref={tagDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Manage Tags</span>
                  </button>

                  {isTagDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-dropdown p-3 z-50 space-y-3 animate-in fade-in">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Select Workspace Tags
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {boardTags.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No tags created yet</p>
                        ) : (
                          boardTags.map((tag) => {
                            const isSelected = taskTags.some((t) => t.id === tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleToggleTag(tag)}
                                className="w-full flex items-center justify-between p-1.5 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-semibold border', tagColors[tag.color] || tagColors.emerald)}>
                                  {tag.name}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Create New Tag */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                        <input
                          type="text"
                          placeholder="New tag name..."
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className="w-full text-xs p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 outline-none"
                        />
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex gap-1">
                            {['emerald', 'sky', 'violet', 'rose', 'amber'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setNewTagColor(c)}
                                className={cn(
                                  'w-4 h-4 rounded-full border-2',
                                  c === 'emerald' && 'bg-emerald-500',
                                  c === 'sky' && 'bg-sky-500',
                                  c === 'violet' && 'bg-violet-500',
                                  c === 'rose' && 'bg-rose-500',
                                  c === 'amber' && 'bg-amber-500',
                                  newTagColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                                )}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleCreateNewTag}
                            disabled={!newTagName.trim()}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-semibold hover:bg-emerald-700 disabled:opacity-40"
                          >
                            Add Tag
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Render Task's Tag Chips */}
            <div className="flex items-center gap-1.5 flex-wrap min-h-[26px]">
              {taskTags.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No tags attached</span>
              ) : (
                taskTags.map((tag) => (
                  <span
                    key={tag.id}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                      tagColors[tag.color] || tagColors.emerald
                    )}
                  >
                    <span>{tag.name}</span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className="hover:opacity-75"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Smart Calendar & Remaining Countdown Widget */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 space-y-3 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Calendar & Deadline</span>
              </div>
              {remainingInfo && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
                    remainingInfo.urgency === 'critical' &&
                    'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-500/30',
                    remainingInfo.urgency === 'high' &&
                    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-500/30',
                    remainingInfo.urgency === 'medium' &&
                    'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border-sky-500/30',
                    remainingInfo.urgency === 'normal' &&
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-500/30'
                  )}
                >
                  {remainingInfo.icon}
                  <span>{remainingInfo.text}</span>
                </span>
              )}
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dueDate}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    handleFieldSave('dueDate', e.target.value || null);
                  }}
                  className="w-full text-xs font-medium py-2 px-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40 dark:[color-scheme:dark]"
                />
              </div>

              {canEdit && dueDate && (
                <button
                  type="button"
                  onClick={() => {
                    setDueDate('');
                    handleFieldSave('dueDate', null);
                  }}
                  className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-slate-200/80 dark:bg-gray-700 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-500/20 transition-colors"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Time Tracking & Workload Estimates Widget */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 space-y-3 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Time Tracking & Estimates</span>
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                {Math.floor(loggedMinutes / 60)}h {loggedMinutes % 60}m logged
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              {/* Live Stopwatch */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Stopwatch</div>
                  <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatTimer(timerSeconds)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={cn(
                    'p-2 rounded-lg text-white font-bold transition-transform active:scale-95',
                    isTimerRunning ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                  )}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Estimate Input */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="text-[10px] uppercase font-bold text-slate-400">Estimated (Hours)</div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={estimatedHours}
                  placeholder="e.g. 4.0"
                  disabled={!canEdit}
                  onChange={(e) => {
                    setEstimatedHours(e.target.value);
                    handleFieldSave('estimatedHours', e.target.value ? parseFloat(e.target.value) : null);
                  }}
                  className="w-full text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent outline-none mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* Interactive Subtasks & Checklist Widget */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 space-y-3.5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Checklist Subtasks</span>
                {subtasks.length > 0 && (
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                    ({completedSubtasksCount}/{subtasks.length})
                  </span>
                )}
              </div>

              {/* Gemini AI Breakdown Button */}
              {canEdit && (
                <button
                  type="button"
                  onClick={handleAIBreakdown}
                  disabled={isGeneratingSubtasks}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{isGeneratingSubtasks ? 'Decomposing...' : 'AI Subtasks'}</span>
                </button>
              )}
            </div>

            {/* Subtasks Progress Bar */}
            {subtasks.length > 0 && (
              <div className="space-y-1">
                <ProgressBar value={completedSubtasksCount} max={subtasks.length} tone="emerald" />
                <div className="text-[10px] text-right font-semibold text-slate-400">
                  {subtasksPercent}% complete
                </div>
              </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-1.5">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/80 group transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(st)}
                    className="flex items-center gap-2.5 min-w-0 text-left flex-1"
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
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Subtask Input Form */}
            {canEdit && (
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add a checklist subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 text-xs py-1.5 px-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="p-1.5 rounded-xl bg-slate-200 dark:bg-gray-700 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Assignee & Collaboration Widget */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 space-y-3 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Assigned Collaborator</span>
              </div>
              {user && canEdit && assignedToId !== user.id && (
                <button
                  type="button"
                  onClick={() => {
                    setAssignedToId(user.id);
                    handleFieldSave('assignedToId', user.id);
                  }}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Assign to me
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {assignedToId ? (
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Avatar
                    name={members.find((m) => m.id === assignedToId)?.name || 'Assignee'}
                    src={members.find((m) => m.id === assignedToId)?.avatarUrl}
                    size="sm"
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {members.find((m) => m.id === assignedToId)?.name || 'Unknown User'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {members.find((m) => m.id === assignedToId)?.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic flex-1">Unassigned</p>
              )}

              {canEdit && (
                <select
                  value={assignedToId}
                  onChange={(e) => {
                    setAssignedToId(e.target.value);
                    handleFieldSave('assignedToId', e.target.value || null);
                  }}
                  className="text-xs font-semibold py-1.5 px-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40 dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-gray-800 [&>option]:dark:text-slate-100"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Description Section with AI Enhancer & Markdown Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <AlignLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Description</span>
              </div>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleAIEnhanceDescription}
                    disabled={isEnhancingDesc}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{isEnhancingDesc ? 'Enhancing...' : 'Enhance with AI'}</span>
                  </button>
                )}

                {canEdit && description && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDesc(!isEditingDesc)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    {isEditingDesc ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </>
                    ) : (
                      <>
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {canEdit && isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => {
                    if (description !== (task.description || '')) {
                      handleFieldSave('description', description);
                    }
                  }}
                  rows={6}
                  placeholder="Add more detailed context, user story, or notes (Markdown supported)..."
                  className="w-full text-xs font-mono text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors leading-relaxed dark:[color-scheme:dark]"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingDesc(false);
                      if (description !== (task.description || '')) {
                        handleFieldSave('description', description);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 shadow-sm transition-colors"
                  >
                    Done Editing
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  if (canEdit) setIsEditingDesc(true);
                }}
                className={cn(
                  'p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800/80 bg-slate-50/70 dark:bg-gray-800/50 transition-colors min-h-[70px]',
                  canEdit && 'cursor-pointer hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-gray-800/80'
                )}
              >
                {description ? (
                  <MarkdownViewer content={description} />
                ) : (
                  <div className="text-xs text-slate-400 italic flex items-center justify-between">
                    <span>No description provided yet. Click to write or use Enhance with AI.</span>
                    {canEdit && <Pencil className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabbed Activity & Discussion Feed */}
          <div className="space-y-4 pt-3 border-t border-gray-200/80 dark:border-gray-800">
            {/* Feed Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('discussion')}
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-1 transition-colors border-b-2',
                    activeTab === 'discussion'
                      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600'
                      : 'text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion ({comments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-1 transition-colors border-b-2',
                    activeTab === 'activity'
                      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600'
                      : 'text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Audit History ({activities.length})</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Discussion Thread */}
            {activeTab === 'discussion' && (
              <div className="space-y-4">
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
                      placeholder="Leave a comment or update... (⌘+Enter to submit)"
                      className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 pr-10 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors leading-relaxed dark:[color-scheme:dark]"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="absolute right-2.5 bottom-3 p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white disabled:opacity-40 disabled:hover:bg-emerald-600 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {isLoadingComments ? (
                    <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
                      Loading discussion...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-slate-400 dark:text-slate-500 text-xs">
                      No comments yet. Share an update above!
                    </div>
                  ) : (
                    comments.map((c) => {
                      const isCommentAuthor = c.userId === user?.id;
                      const canDelete = isCommentAuthor || userRole === 'OWNER';

                      return (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-800 space-y-1.5 group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar name={c.user?.name || 'User'} src={c.user?.avatarUrl} size="xs" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {c.user?.name || 'Unknown User'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(c.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                {new Date(c.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c.id)}
                                title="Delete comment"
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pl-6">
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

            {/* Tab 2: Activity Audit Log Feed */}
            {activeTab === 'activity' && (
              <div className="space-y-2.5">
                {isLoadingActivities ? (
                  <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
                    Loading activity timeline...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No activity recorded for this task yet.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-800 flex items-start gap-2.5 text-xs"
                    >
                      <Avatar name={act.user?.name || 'User'} src={act.user?.avatarUrl} size="xs" className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {act.user?.name || 'User'}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
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
          </div>
        </div>
      </aside>
    </>
  );
};
