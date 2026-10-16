import React, { useRef, useState } from 'react';
import {
  Bold,
  CheckSquare,
  Code,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { MarkdownViewer } from './MarkdownViewer';

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

type FormatAction =
  | { label: string; icon: React.ReactNode; before: string; after: string }
  | { label: string; icon: React.ReactNode; prefix: string };

const actions: FormatAction[] = [
  { label: 'Bold', icon: <Bold className="h-4 w-4" />, before: '**', after: '**' },
  { label: 'Italic', icon: <Italic className="h-4 w-4" />, before: '*', after: '*' },
  {
    label: 'Strikethrough',
    icon: <Strikethrough className="h-4 w-4" />,
    before: '~~',
    after: '~~',
  },
  { label: 'Heading', icon: <Heading2 className="h-4 w-4" />, prefix: '## ' },
  { label: 'Bulleted list', icon: <List className="h-4 w-4" />, prefix: '- ' },
  { label: 'Numbered list', icon: <ListOrdered className="h-4 w-4" />, prefix: '1. ' },
  { label: 'Task list', icon: <CheckSquare className="h-4 w-4" />, prefix: '- [ ] ' },
  { label: 'Quote', icon: <Quote className="h-4 w-4" />, prefix: '> ' },
  { label: 'Code', icon: <Code className="h-4 w-4" />, before: '`', after: '`' },
  { label: 'Link', icon: <Link2 className="h-4 w-4" />, before: '[', after: '](https://)' },
];

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  id,
  value,
  onChange,
  placeholder,
  rows = 6,
  disabled = false,
}) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyAction = (action: FormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    if (!('prefix' in action)) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end) || 'text';
      const replacement = `${action.before}${selected}${action.after}`;
      const nextValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`;
      onChange(nextValue);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + action.before.length, start + action.before.length + selected.length);
      });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const nextLineBreak = value.indexOf('\n', end);
    const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
    const selectedLines = value.slice(lineStart, end > start ? Math.max(end, lineEnd) : lineEnd);
    const lines = (selectedLines || 'text').split('\n');
    const replacement = lines.map((line) => `${action.prefix}${line}`).join('\n');
    const nextValue = `${value.slice(0, lineStart)}${replacement}${value.slice(
      lineStart + selectedLines.length
    )}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + replacement.length);
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-2 py-1.5 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-1">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              title={action.label}
              aria-label={action.label}
              disabled={disabled}
              onClick={() => applyAction(action)}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {action.icon}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] dark:bg-gray-700">
          {(['write', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={mode === tab}
              onClick={() => setMode(tab)}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium capitalize transition-colors',
                mode === tab
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-gray-600 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {mode === 'write' ? (
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="block w-full resize-y border-0 bg-transparent px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      ) : (
        <div className="min-h-[9rem] px-3 py-2.5">
          <MarkdownViewer content={value} emptyMessage="Nothing to preview yet." />
        </div>
      )}
      <div className="border-t border-gray-100 px-3 py-1.5 text-[10px] text-slate-400 dark:border-gray-700">
        Markdown supported
      </div>
    </div>
  );
};
