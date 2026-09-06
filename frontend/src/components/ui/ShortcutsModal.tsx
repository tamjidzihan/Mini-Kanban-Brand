import React from 'react';
import { Modal } from './Modal';
import { Command, Lightbulb } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { label: 'Global search', keys: [modKey, 'K'] },
    { label: 'Create new board / task', keys: [modKey, 'N'] },
    { label: 'Toggle dark / light mode', keys: [modKey, 'D'] },
    { label: 'Keyboard shortcuts help', keys: ['?'] },
    { label: 'Close overlay / modal', keys: ['Esc'] },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="sm">
      <div className="space-y-4">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2.5 px-1 text-xs"
            >
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {s.label}
              </span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[10px] font-semibold font-mono rounded bg-slate-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pro Tip */}
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <p className="leading-snug">
            Press <kbd className="font-mono font-semibold">{modKey}+K</kbd> anywhere to search boards, columns, and tasks instantly.
          </p>
        </div>
      </div>
    </Modal>
  );
};
