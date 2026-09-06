import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Kanban, CheckSquare, X, ArrowRight, CornerDownLeft, Sparkles, Moon, Sun, LayoutGrid, Calendar, List, BarChart2, Home } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/cn';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'board' | 'task' | 'action';
  title: string;
  subtitle?: string;
  boardId?: string;
  extra?: string;
  action?: () => void;
  icon?: React.ReactNode;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, theme } = useTheme();

  // Quick Action Commands
  const quickActions = useMemo<SearchResult[]>(() => {
    const isBoardPage = location.pathname.startsWith('/board/');
    const actions: SearchResult[] = [
      {
        id: 'action-theme',
        type: 'action',
        title: `Toggle Theme (Currently: ${theme})`,
        subtitle: 'Switch between light, dark, and system color modes',
        icon: <Moon className="w-3.5 h-3.5" />,
        action: () => toggleTheme(),
      },
      {
        id: 'action-home',
        type: 'action',
        title: 'Go to Dashboard',
        subtitle: 'Navigate to workspaces and all boards overview',
        icon: <Home className="w-3.5 h-3.5" />,
        action: () => navigate('/'),
      },
    ];

    if (isBoardPage) {
      actions.push(
        {
          id: 'action-view-kanban',
          type: 'action',
          title: 'Switch to Kanban Board View',
          subtitle: 'View workflow columns and drag cards',
          icon: <LayoutGrid className="w-3.5 h-3.5" />,
          action: () => {
            window.dispatchEvent(new CustomEvent('change-board-view', { detail: 'kanban' }));
          },
        },
        {
          id: 'action-view-calendar',
          type: 'action',
          title: 'Switch to Calendar View',
          subtitle: 'View monthly schedule and deadlines',
          icon: <Calendar className="w-3.5 h-3.5" />,
          action: () => {
            window.dispatchEvent(new CustomEvent('change-board-view', { detail: 'calendar' }));
          },
        },
        {
          id: 'action-view-list',
          type: 'action',
          title: 'Switch to List Table View',
          subtitle: 'Compact sorting table of tasks',
          icon: <List className="w-3.5 h-3.5" />,
          action: () => {
            window.dispatchEvent(new CustomEvent('change-board-view', { detail: 'list' }));
          },
        },
        {
          id: 'action-view-analytics',
          type: 'action',
          title: 'Switch to Analytics & Metrics View',
          subtitle: 'View workload, completion rate, and time velocity',
          icon: <BarChart2 className="w-3.5 h-3.5" />,
          action: () => {
            window.dispatchEvent(new CustomEvent('change-board-view', { detail: 'analytics' }));
          },
        }
      );
    }

    return actions;
  }, [location.pathname, theme, toggleTheme, navigate]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(quickActions);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, quickActions]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(quickActions);
      return;
    }

    // Filter quick actions
    const filteredActions = quickActions.filter((a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      (a.subtitle && a.subtitle.toLowerCase().includes(query.toLowerCase()))
    );

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/boards/search?q=${encodeURIComponent(query)}`);
        const { boards = [], tasks = [] } = res.data;

        const formattedBoards: SearchResult[] = boards.map((b: any) => ({
          id: b.id,
          type: 'board',
          title: b.title,
          subtitle: b.description || 'Board',
          boardId: b.id,
        }));

        const formattedTasks: SearchResult[] = tasks.map((t: any) => ({
          id: t.id,
          type: 'task',
          title: t.title,
          subtitle: `in "${t.column?.title || 'Column'}" • Board: ${t.board?.title || ''}`,
          boardId: t.boardId,
          extra: t.priority,
        }));

        const combined = [...filteredActions, ...formattedBoards, ...formattedTasks];
        setResults(combined);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed:', err);
        setResults(filteredActions);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, quickActions]);

  const handleSelect = (item: SearchResult) => {
    onClose();
    if (item.type === 'action' && item.action) {
      item.action();
    } else if (item.type === 'board') {
      navigate(`/board/${item.id}`);
    } else if (item.boardId) {
      navigate(`/board/${item.boardId}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 sm:pt-20 overflow-y-auto">
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-dropdown overflow-hidden flex flex-col transition-all"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search boards, tasks, or columns..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Searching workspace...
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No results found for <span className="font-semibold text-slate-600 dark:text-slate-300">"{query}"</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const isBoard = item.type === 'board';
                const isAction = item.type === 'action';

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors',
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-950 dark:text-emerald-100'
                        : 'hover:bg-slate-50 dark:hover:bg-gray-800/60 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold',
                          isAction
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                            : isBoard
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400'
                        )}
                      >
                        {item.icon ? item.icon : isBoard ? <Kanban className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.extra && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300">
                          {item.extra}
                        </span>
                      )}
                      {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <p className="text-xs text-slate-400">
                Type anything to search across all your boards, columns, and tasks.
              </p>
              <div className="flex justify-center gap-3 mt-3 text-[11px] text-slate-400">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>ESC Dismiss</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
