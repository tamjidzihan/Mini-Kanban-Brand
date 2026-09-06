import { useEffect } from 'react';

export interface ShortcutHandlers {
  onSearch?: () => void;
  onNew?: () => void;
  onToggleTheme?: () => void;
  onHelp?: () => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      const target = event.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Escape always fires
      if (event.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

      // ⌘K or Ctrl+K (Search)
      if (isModifier && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        handlers.onSearch?.();
        return;
      }

      // ⌘N or Ctrl+N (New Record)
      if (isModifier && (event.key === 'n' || event.key === 'N')) {
        event.preventDefault();
        handlers.onNew?.();
        return;
      }

      // ⌘D or Ctrl+D (Toggle Dark Mode)
      if (isModifier && (event.key === 'd' || event.key === 'D')) {
        event.preventDefault();
        handlers.onToggleTheme?.();
        return;
      }

      // '?' for shortcuts modal (suppressed inside inputs)
      if (!isModifier && !isInput && event.key === '?') {
        event.preventDefault();
        handlers.onHelp?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};
