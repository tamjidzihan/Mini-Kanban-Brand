// Data formatting conventions per design_react.md §20

export const formatDate = (dateStr?: string | Date | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const formatShortDate = (dateStr?: string | Date | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatTime = (dateStr?: string | Date | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

export interface DueStatus {
  label: string;
  tone: 'rose' | 'amber' | 'emerald' | 'slate';
  isOverdue: boolean;
  isToday: boolean;
}

export const getDueStatus = (dueDateStr?: string | Date | null): DueStatus | null => {
  if (!dueDateStr) return null;
  const now = new Date();
  const due = new Date(dueDateStr);

  // Strip time for clean day comparison
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();

  const diffDays = Math.round((dueDay - nowDay) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      label: daysAgo === 1 ? 'Overdue (yesterday)' : `Overdue (${daysAgo}d ago)`,
      tone: 'rose',
      isOverdue: true,
      isToday: false,
    };
  }

  if (diffDays === 0) {
    return {
      label: 'Due today',
      tone: 'amber',
      isOverdue: false,
      isToday: true,
    };
  }

  if (diffDays === 1) {
    return {
      label: 'Due tomorrow',
      tone: 'sky' as 'slate',
      isOverdue: false,
      isToday: false,
    };
  }

  return {
    label: `Due ${formatShortDate(due)}`,
    tone: 'slate',
    isOverdue: false,
    isToday: false,
  };
};
