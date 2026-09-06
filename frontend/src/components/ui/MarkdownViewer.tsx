import React from 'react';
import { cn } from '../../lib/cn';
import { CheckSquare, Square } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className }) => {
  if (!content || !content.trim()) {
    return <p className="text-xs text-slate-400 italic">No description provided.</p>;
  }

  // Parse lines into structured blocks
  const lines = content.split('\n');

  // Helper to format inline elements: **bold**, *italic*, `code`
  const renderInline = (text: string) => {
    // Replace inline bold, code, and italic with formatted spans
    const parts: React.ReactNode[] = [];
    let current = text;
    let key = 0;

    // Regex for bold **text** or inline code `code` or italic *text*
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(current)) !== null) {
      if (match.index > lastIndex) {
        parts.push(current.substring(lastIndex, match.index));
      }

      const matchText = match[0];
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={key++} className="font-bold text-slate-900 dark:text-white">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-gray-700 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]"
          >
            {matchText.slice(1, -1)}
          </code>
        );
      } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
        parts.push(
          <em key={key++} className="italic text-slate-600 dark:text-slate-300">
            {matchText.slice(1, -1)}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < current.length) {
      parts.push(current.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={cn('text-xs text-slate-800 dark:text-slate-200 space-y-2.5 leading-relaxed', className)}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Heading 1 (# Heading)
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-sm font-bold text-slate-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-1 mt-3">
              {renderInline(trimmed.slice(2))}
            </h2>
          );
        }

        // Heading 2 (## Heading)
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mt-2.5">
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }

        // Heading 3 (### Heading)
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-2 text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span>{renderInline(trimmed.slice(4))}</span>
            </h4>
          );
        }

        // Checklist item checked (- [x] text)
        if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-slate-400 dark:text-slate-500 line-through">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{renderInline(trimmed.slice(5).trim())}</span>
            </div>
          );
        }

        // Checklist item unchecked (- [ ] text)
        if (trimmed.startsWith('- [ ]')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-slate-700 dark:text-slate-300">
              <Square className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <span>{renderInline(trimmed.slice(5).trim())}</span>
            </div>
          );
        }

        // Bullet point (- text or * text)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Blockquote (> quote)
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-emerald-500 pl-3 italic text-slate-600 dark:text-slate-400 my-1">
              {renderInline(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-slate-700 dark:text-slate-300">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
};
